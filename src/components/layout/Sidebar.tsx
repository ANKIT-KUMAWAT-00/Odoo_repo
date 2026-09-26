"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Building2,
  MapPin,
  Tag,
  Sliders,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FileDown,
  Truck,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  ShieldCheck,
  UserCheck,
  LogOut,
  User,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUser } from "./UserContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  managerOnly?: boolean;
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const { user, isManager, logout } = useUser();

  const mainNav: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    {
      name: "Operations",
      href: "/operations",
      icon: Layers,
      subItems: [
        { name: "Receipts", href: "/operations/receipts", icon: FileDown },
        { name: "Delivery Orders", href: "/operations/deliveries", icon: Truck },
        { name: "Internal Transfers", href: "/operations/transfers", icon: ArrowRightLeft },
        { name: "Stock Adjustments", href: "/operations/adjustments", icon: SlidersHorizontal },
        { name: "Move History", href: "/operations/moves", icon: History },
      ],
    },
  ];

  const managementNav: NavItem[] = [
    { name: "Warehouses", href: "/warehouses", icon: Building2 },
    { name: "Locations", href: "/locations", icon: MapPin },
    { name: "Categories", href: "/categories", icon: Tag },
    { name: "Reordering Rules", href: "/reorder-rules", icon: Sliders },
  ];

  const systemNav: NavItem[] = [
    { name: "Audit Logs", href: "/audit", icon: ShieldCheck, managerOnly: true },
    { name: "Settings", href: "/settings", icon: Settings, managerOnly: true },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-white tracking-tight flex items-center">
                  StockSense
                  <span className="ml-1 text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.2 rounded">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Control Your Flow</span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-4 space-y-6">
          {/* Main Group */}
          <div>
            {!isCollapsed && (
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Main
              </h4>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                if (item.subItems) {
                  const isAnySubActive = item.subItems.some((s) => pathname.startsWith(s.href));
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setOperationsOpen(!operationsOpen)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                          isAnySubActive
                            ? "bg-slate-800/80 text-white"
                            : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          operationsOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )
                        )}
                      </button>

                      {(!isCollapsed && operationsOpen) && (
                        <div className="pl-6 pr-1 py-1 space-y-1 mt-1 border-l border-slate-800 ml-4">
                          {item.subItems.map((sub) => {
                            const active = pathname.startsWith(sub.href);
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "flex items-center space-x-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                  active
                                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                )}
                              >
                                <sub.icon className="w-3.5 h-3.5" />
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Management Group */}
          <div>
            {!isCollapsed && (
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Management
              </h4>
            )}
            <nav className="space-y-1">
              {managementNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* System Group */}
          <div>
            {!isCollapsed && (
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                System
              </h4>
            )}
            <nav className="space-y-1">
              {systemNav.map((item) => {
                if (item.managerOnly && !isManager) return null;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Profile section */}
      <div className="border-t border-slate-800 p-3 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 min-w-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user?.name || "Inventory User"}</span>
                <span className="text-[10px] text-brand-400 font-medium truncate flex items-center">
                  {isManager ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Manager
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 mr-0.5 inline" /> Staff
                    </>
                  )}
                </span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 h-screen sticky top-0 z-40 select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-slate-900 border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
