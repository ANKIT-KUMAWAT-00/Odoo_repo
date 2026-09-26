import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}
