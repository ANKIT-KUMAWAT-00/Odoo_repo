import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatarUrl, currentPassword, newPassword } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (phone !== undefined) dataToUpdate.phone = phone.trim();
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl.trim();

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set new password" }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
      }

      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "UPDATE_PROFILE",
        entity: "User",
        entityId: user.id,
        newValue: "Updated personal profile details",
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
