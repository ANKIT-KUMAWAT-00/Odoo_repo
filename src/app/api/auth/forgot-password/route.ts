import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any older tokens for this email
    await prisma.otpToken.deleteMany({
      where: { email: cleanEmail },
    });

    await prisma.otpToken.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
        verified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "One-Time Password has been generated.",
      // Include mock OTP for safe demo testing
      mockOtp: otp,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to initiate password reset" }, { status: 500 });
  }
}
