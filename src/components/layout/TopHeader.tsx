"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, User, LogOut, ShieldCheck, UserCheck, ChevronDown } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { WarehouseSelector } from "./WarehouseSelector";
import { NotificationDropdown } from "./NotificationDropdown";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { useUser } from "./UserContext";

export function TopHeader({ onToggleMobileSidebar }: { onToggleMobileSidebar: () => void }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isManager, logout } = useUser();

  // Listen for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs />
        </div>

        {/* Center/Right: Global Search, Warehouse Selector, Notifications, User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Quick Search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 rounded-xl px-3 py-2 transition-all w-36 sm:w-64 focus:outline-none"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate flex-1 text-left hidden sm:inline">Search SKU, orders, products...</span>
            <span className="truncate flex-1 text-left sm:hidden">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Warehouse Selector */}
          <WarehouseSelector />

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs ring-2 ring-brand-500/20 overflow-hidden">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || "Inventory User"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isManager ? "Inventory Manager" : "Warehouse Staff"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    {isManager ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1 text-brand-600" />
                        Inventory Manager
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3 mr-1 text-slate-600" />
                        Warehouse Staff
                      </>
                    )}
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 mr-2.5 text-slate-400" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
