"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => showToast(title, message, "success"),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string) => showToast(title, message, "error", 5000),
    [showToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => showToast(title, message, "warning"),
    [showToast]
  );
  const info = useCallback(
    (title: string, message?: string) => showToast(title, message, "info"),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none p-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0",
              toast.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
              toast.type === "error" && "bg-rose-50 border-rose-200 text-rose-900",
              toast.type === "warning" && "bg-amber-50 border-amber-200 text-amber-900",
              toast.type === "info" && "bg-slate-900 border-slate-800 text-white"
            )}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {toast.type === "error" && <XCircle className="h-5 w-5 text-rose-600" />}
              {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {toast.type === "info" && <Info className="h-5 w-5 text-sky-400" />}
            </div>
            <div className="flex-1 mr-2">
              <div className="font-semibold">{toast.title}</div>
              {toast.message && <div className="text-xs mt-0.5 opacity-90">{toast.message}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
