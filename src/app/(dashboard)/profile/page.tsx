"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, ShieldCheck, UserCheck, Calendar, Lock, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/format";
import { useUser } from "@/components/layout/UserContext";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setName(p.name);
          setEmail(p.email);
          setPhone(p.phone || "");
          setAvatarUrl(p.avatarUrl || "");
          setRole(p.role);
          setCreatedAt(p.createdAt);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Update Failed", data.error);
      } else {
        toast.success("Profile Updated", "Your contact details have been refreshed");
        setUser(data.profile);
      }
    } catch {
      toast.error("Error", "Network error updating profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsPasswordLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to Change Password", data.error);
      } else {
        toast.success("Password Updated", "Your new password is now active");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Error", "Network error updating password.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal operator identity, contact information, and security credentials
        </p>
      </div>

      {/* User Info Hero Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative w-20 h-20 rounded-2xl bg-slate-700 border-2 border-slate-600 overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-bold">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name.charAt(0) || "U"}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
              <h2 className="text-xl font-bold">{name}</h2>
              {role === "INVENTORY_MANAGER" ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 w-fit mx-auto sm:mx-0">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-400" />
                  Inventory Manager
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600 w-fit mx-auto sm:mx-0">
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  Warehouse Staff
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-4">
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {email}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Member since {formatDate(createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Profile Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="w-4 h-4 text-brand-600" />
              <span>Edit Personal Details</span>
            </CardTitle>
            <CardDescription>Update your display name and contact phone</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Work Email (Read Only)
                </label>
                <Input value={email} disabled className="bg-slate-50 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Avatar Image URL
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button type="submit" size="sm" isLoading={isLoading} className="w-full mt-2">
                <Save className="w-4 h-4 mr-1.5" />
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>Update your operator security authentication password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Current Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isPasswordLoading}
                className="w-full mt-2"
              >
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
