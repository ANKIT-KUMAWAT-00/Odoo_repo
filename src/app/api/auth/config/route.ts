import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isSupabaseConfigured();
  return NextResponse.json({
    supabaseConfigured: configured,
    supabaseUrl: configured ? process.env.NEXT_PUBLIC_SUPABASE_URL : null,
  });
}
