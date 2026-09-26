import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const tokenRecord = await prisma.otpToken.findFirst({
      where: {
        email: cleanEmail,
        otp: otp.trim(),
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid OTP code entered" }, { status: 400 });
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
    }

    // Mark verified
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "OTP successfully verified.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
