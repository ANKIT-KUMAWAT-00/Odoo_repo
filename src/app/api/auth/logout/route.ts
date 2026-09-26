import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth/session";
import { createClient as createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout warning:", e);
    }
  }

  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}
