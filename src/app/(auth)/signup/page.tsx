"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Lock, Mail, User, ShieldCheck, UserCheck, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
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
  const [successInfo, setSuccessInfo] = useState<{ message: string; requiresEmailConfirmation: boolean } | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setSupabaseConfigured(Boolean(data.supabaseConfigured));
      })
      .catch(() => {});
  }, []);

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
        if (data.requiresEmailConfirmation) {
          setSuccessInfo({
            message: data.message || "Please check your email inbox to confirm your account before logging in.",
            requiresEmailConfirmation: true,
          });
          toast.success("Account Created!", "Verification email sent.");
        } else {
          toast.success("Account Created!", "Welcome to StockSense.");
          router.push("/dashboard");
          router.refresh();
        }
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
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Know Your Stock. Control Your Flow.
          </p>

          {/* Supabase Status Pill */}
          <div className="mt-3 flex justify-center">
            {supabaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Auth Active
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Local & Supabase Auth Supported
              </div>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          {successInfo ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Check Your Email</h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                {successInfo.message}
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button className="w-full">Proceed to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Create new account</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your details to join your warehouse team</p>
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
                      placeholder="Alex Morgan"
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
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Role in Organization
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("INVENTORY_MANAGER")}
                      className={`flex items-center p-2.5 rounded-xl border text-left transition-all ${
                        role === "INVENTORY_MANAGER"
                          ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <ShieldCheck
                        className={`w-4 h-4 mr-2 ${
                          role === "INVENTORY_MANAGER" ? "text-brand-600" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Manager</p>
                        <p className="text-[10px] text-slate-500">Full control</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("WAREHOUSE_STAFF")}
                      className={`flex items-center p-2.5 rounded-xl border text-left transition-all ${
                        role === "WAREHOUSE_STAFF"
                          ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <UserCheck
                        className={`w-4 h-4 mr-2 ${
                          role === "WAREHOUSE_STAFF" ? "text-brand-600" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Staff</p>
                        <p className="text-[10px] text-slate-500">Operations</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Confirm
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 text-xs"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
