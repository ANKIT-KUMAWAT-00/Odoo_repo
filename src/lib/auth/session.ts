import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/db/prisma";
import { createClient as createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
  avatarUrl?: string | null;
}

const SECRET = process.env.JWT_SECRET || "stocksense_enterprise_secure_session_secret_2026_jwt";
const COOKIE_NAME = "stocksense_session";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return hmac.digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const data = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const expectedSig = sign(encoded);
    if (signature !== expectedSig) return null;
    const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed.exp && Date.now() > parsed.exp) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      avatarUrl: parsed.avatarUrl,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    // 1. Check Supabase Auth if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.email) {
          const email = user.email.toLowerCase().trim();
          const metaName =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            email.split("@")[0];
          const metaRole =
            user.user_metadata?.role === "INVENTORY_MANAGER"
              ? "INVENTORY_MANAGER"
              : "WAREHOUSE_STAFF";

          // Sync with local Prisma User table to preserve relational integrity
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              name: metaName,
              role: metaRole,
            },
            create: {
              email,
              name: metaName,
              role: metaRole,
              password: "supabase_managed_auth",
            },
          });

          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
            avatarUrl: dbUser.avatarUrl,
          };
        }
      } catch (sbErr) {
        console.warn("Supabase auth check error, falling back to local cookie:", sbErr);
      }
    }

    // 2. Fallback to local cookie token
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export function isManager(user: SessionUser | null): boolean {
  return user?.role === "INVENTORY_MANAGER";
}

export { COOKIE_NAME };
