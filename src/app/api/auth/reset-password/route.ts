import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const tokenRecord = await prisma.otpToken.findFirst({
      where: {
        email: cleanEmail,
        otp: otp.trim(),
        verified: true,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Unauthorized or unverified reset request" }, { status: 403 });
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json({ error: "Session expired. Please request a new OTP." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword },
    });

    // Cleanup OTP tokens for this user
    await prisma.otpToken.deleteMany({
      where: { email: cleanEmail },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. Please log in with your new credentials.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
