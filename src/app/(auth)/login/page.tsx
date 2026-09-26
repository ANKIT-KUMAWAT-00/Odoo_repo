"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, KeyRound, HelpCircle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign in");
        toast.error("Authentication Failed", data.error || "Invalid credentials");
      } else {
        toast.success("Welcome back!", `Signed in as ${data.user.name}`);
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
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
                Supabase Auth Connected
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSupabaseGuide(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Supabase Ready (Click to Setup)
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {supabaseConfigured
                ? "Enter your Supabase credentials or demo account"
                : "Enter your credentials to access warehouse operations"}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-slate-600">
                Remember this device for 7 days
              </label>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In to StockSense"}
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("manager@stocksense.com", "manager123")}
                className="flex items-center p-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mr-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Manager</p>
                  <p className="text-[10px] text-slate-500 truncate">Full Admin Access</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("staff@stocksense.com", "staff123")}
                className="flex items-center p-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Staff</p>
                  <p className="text-[10px] text-slate-500 truncate">Warehouse Ops</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>

      {/* Supabase Guide Modal */}
      {showSupabaseGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 text-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Connect Your Supabase Project</h3>
                  <p className="text-xs text-slate-500">Enable real production authentication in 2 minutes</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Step 1: Open Supabase</p>
                <p className="text-slate-600">
                  Sign in to your free account at{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline font-medium inline-flex items-center"
                  >
                    supabase.com/dashboard <ExternalLink className="w-3 h-3 ml-1 inline" />
                  </a>{" "}
                  and create or select your project.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Step 2: Copy API Keys</p>
                <p className="text-slate-600">
                  Go to <strong>Project Settings</strong> ➔ <strong>API</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Step 3: Paste into your <code>.env</code> file</p>
                <div className="p-3 bg-slate-900 rounded-xl text-slate-100 font-mono text-[11px] space-y-1">
                  <p className="text-slate-400"># In stocksense/.env:</p>
                  <p>
                    <span className="text-sky-300">NEXT_PUBLIC_SUPABASE_URL</span>=&quot;https://your-id.supabase.co&quot;
                  </p>
                  <p>
                    <span className="text-sky-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=&quot;eyJhbGci...&quot;
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                <p className="font-semibold">Note on Seeded Demo Accounts:</p>
                <p className="mt-0.5 text-[11px] text-emerald-700">
                  Even after adding Supabase, you can still test with the one-click demo accounts or create real accounts with your own email and password!
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" onClick={() => setShowSupabaseGuide(false)} className="text-xs">
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
