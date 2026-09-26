import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { createClient as createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. If Supabase Auth is configured, attempt Supabase sign-in
    if (isSupabaseConfigured()) {
      try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
          const metaName =
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            cleanEmail.split("@")[0];
          const metaRole =
            data.user.user_metadata?.role === "INVENTORY_MANAGER"
              ? "INVENTORY_MANAGER"
              : "WAREHOUSE_STAFF";

          // Sync into Prisma User table
          const dbUser = await prisma.user.upsert({
            where: { email: cleanEmail },
            update: {
              name: metaName,
              role: metaRole,
            },
            create: {
              email: cleanEmail,
              name: metaName,
              role: metaRole,
              password: "supabase_managed_auth",
            },
          });

          // Set session cookie for App Router
          const token = createSessionToken({
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
            avatarUrl: dbUser.avatarUrl,
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
            provider: "supabase",
            user: {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
              avatarUrl: dbUser.avatarUrl,
            },
          });
        }
      } catch (sbErr) {
        console.warn("Supabase login attempt error:", sbErr);
      }
    }

    // 2. Fallback / Local account login (supports seeded demo accounts)
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
      avatarUrl: user.avatarUrl,
    });

    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      provider: "local",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during login" }, { status: 500 });
  }
}
