import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { UserProvider } from "@/components/layout/UserContext";
import { WarehouseProvider } from "@/components/layout/WarehouseContext";
import { DashboardClientShell } from "@/components/layout/DashboardClientShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  // Fetch full user profile from DB
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Fetch warehouses for header selector
  const warehouses = await prisma.warehouse.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <UserProvider
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "INVENTORY_MANAGER" | "WAREHOUSE_STAFF",
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      }}
    >
      <WarehouseProvider initialWarehouses={warehouses}>
        <DashboardClientShell>{children}</DashboardClientShell>
      </WarehouseProvider>
    </UserProvider>
  );
}
