"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Mail, KeyRound, Lock, ArrowLeft, ArrowRight, CheckCircle2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const toast = useToast();

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "OTP" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please provide your email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate OTP");
        toast.error("Error", data.error);
      } else {
        setMockOtp(data.mockOtp || null);
        setStep("OTP");
        setCountdown(60);
        setCanResend(false);
        toast.success("Code Sent", "Verification code dispatched to your email");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP code");
        toast.error("Invalid Code", data.error);
      } else {
        setStep("NEW_PASSWORD");
        toast.success("Code Verified", "Please enter your new password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        toast.error("Error", data.error);
      } else {
        setStep("SUCCESS");
        toast.success("Password Reset", "Your password has been changed successfully!");
      }
    } catch {
      setError("Network error. Please try again.");
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
          <p className="text-xs text-slate-400 mt-0.5">Password Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === "EMAIL" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Forgot Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered work email to receive a secure 6-digit OTP code.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="manager@stocksense.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 mt-2" isLoading={isLoading}>
                  Send Verification Code <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === "OTP" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Enter Verification Code</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>
                </p>
              </div>

              {/* Dev/Demo Mode Mock OTP Banner */}
              {mockOtp && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>Demo Mode OTP: <strong className="text-amber-900 text-sm tracking-widest">{mockOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(mockOtp)}
                    className="text-[11px] underline font-semibold text-amber-900 hover:text-amber-700"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    6-Digit Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-9 h-11 text-center font-mono text-lg tracking-widest"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    Expires in: <strong className="text-slate-800">{countdown}s</strong>
                  </span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-brand-600 font-semibold hover:underline flex items-center"
                    >
                      <RotateCw className="w-3 h-3 mr-1" /> Resend Code
                    </button>
                  ) : (
                    <span className="text-slate-400">Resend in {countdown}s</span>
                  )}
                </div>

                <Button type="submit" className="w-full h-10 mt-2" isLoading={isLoading}>
                  Verify OTP <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === "NEW_PASSWORD" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Set New Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your new secure password below
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 h-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Confirm New Password
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

                <Button type="submit" className="w-full h-10 mt-2" isLoading={isLoading}>
                  Confirm & Update Password
                </Button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "SUCCESS" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password Changed!</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your password has been successfully updated. You can now log in using your new credentials.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full mt-6 h-10"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </div>

        {/* Back Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/login" className="text-slate-300 hover:text-white flex items-center justify-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Sign In</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
