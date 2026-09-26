"use client";

import React from "react";
import { AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary" | "success";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-start space-x-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              variant === "danger"
                ? "bg-rose-100 text-rose-600"
                : variant === "warning"
                ? "bg-amber-100 text-amber-600"
                : variant === "success"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-brand-100 text-brand-600"
            }`}
          >
            {variant === "danger" && <AlertCircle className="w-6 h-6" />}
            {variant === "warning" && <AlertTriangle className="w-6 h-6" />}
            {variant === "success" && <HelpCircle className="w-6 h-6" />}
            {variant === "primary" && <HelpCircle className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={
              variant === "danger"
                ? "destructive"
                : variant === "success"
                ? "success"
                : "default"
            }
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
