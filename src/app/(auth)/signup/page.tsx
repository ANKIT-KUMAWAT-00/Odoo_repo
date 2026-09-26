"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Lock, Mail, User, ShieldCheck, UserCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"INVENTORY_MANAGER" | "WAREHOUSE_STAFF">("INVENTORY_MANAGER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const toast = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        toast.error("Registration Failed", data.error);
      } else {
        toast.success("Account Created!", "Welcome to StockSense.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/20 mb-3">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockSense</h1>
          <p className="text-xs text-slate-400 mt-0.5">Know Your Stock. Control Your Flow.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Create new account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Join your organization&apos;s inventory management system</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="alex@stocksense.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("INVENTORY_MANAGER")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    role === "INVENTORY_MANAGER"
                      ? "border-brand-600 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 mb-1 ${role === "INVENTORY_MANAGER" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold">Manager</span>
                  <span className="text-[10px] text-slate-500">Full operational control</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("WAREHOUSE_STAFF")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    role === "WAREHOUSE_STAFF"
                      ? "border-brand-600 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <UserCheck className={`w-5 h-5 mb-1 ${role === "WAREHOUSE_STAFF" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold">Staff</span>
                  <span className="text-[10px] text-slate-500">Floor & execution focus</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" isLoading={isLoading}>
              Create Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
