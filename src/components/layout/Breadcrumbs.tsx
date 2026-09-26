"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/dashboard") {
    return (
      <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
        <Home className="w-4 h-4 text-slate-400" />
        <span>/</span>
        <span className="text-slate-800 font-semibold">Dashboard</span>
      </div>
    );
  }

  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbs = parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/");
    const label = part
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = index === parts.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center space-x-1.5 text-sm text-slate-500 font-medium overflow-hidden">
      <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 flex items-center transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.href + idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {crumb.isLast ? (
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
