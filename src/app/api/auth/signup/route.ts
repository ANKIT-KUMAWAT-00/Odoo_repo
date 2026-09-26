import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { createClient as createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const assignedRole = role === "INVENTORY_MANAGER" ? "INVENTORY_MANAGER" : "WAREHOUSE_STAFF";

    // 1. If Supabase Auth is configured, register through Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              role: assignedRole,
            },
          },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Also record in Prisma for local relation integrity
        const dbUser = await prisma.user.upsert({
          where: { email: cleanEmail },
          update: {
            name: name.trim(),
            role: assignedRole,
          },
          create: {
            email: cleanEmail,
            name: name.trim(),
            role: assignedRole,
            password: "supabase_managed_auth",
          },
        });

        // If session was returned immediately (auto-confirm enabled)
        if (data.session) {
          const token = createSessionToken({
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
          });

          cookies().set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
          });
        }

        return NextResponse.json({
          success: true,
          provider: "supabase",
          requiresEmailConfirmation: !data.session,
          message: !data.session
            ? "Account created! Please check your email to confirm your registration."
            : "Account created and logged in successfully!",
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
          },
        });
      } catch (sbErr: any) {
        console.warn("Supabase signup error:", sbErr);
        return NextResponse.json({ error: sbErr.message || "Failed to create Supabase account" }, { status: 500 });
      }
    }

    // 2. Fallback / Local account registration
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email address already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: assignedRole,
      },
    });

    // Session
    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
    });

    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      provider: "local",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
