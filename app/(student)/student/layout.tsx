"use client";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AIAssistantButton } from "@/components/ai-assistant-button";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");
  const [userType] = useState("student");
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || "Student");
        setUserEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }
    }
    fetchUser();
  }, []);

  // Update name handler
  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameError("");
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName },
      });
      if (error) throw error;
      setUserName(newName);
      setEditingName(false);
    } catch (err: any) {
      setNameError(err.message || "Failed to update name");
    } finally {
      setNameLoading(false);
    }
  }

  // Change password handler
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordSuccess("Password updated!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Sign out handler
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // Avatar upload handler
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userEmail.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        userType={userType}
        userName={userName}
        avatarUrl={avatarUrl}
        onProfileClick={() => setProfileOpen(true)}
      />
      <SidebarInset>
        <div className="container py-6 max-w-7xl">{children}</div>
        <AIAssistantButton />
      </SidebarInset>
      {/* Profile modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg?height=80&width=80"}
                />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                id="avatar-upload"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading..." : "Change Profile Picture"}
              </Button>
              {avatarError && (
                <div className="text-xs text-red-500 mt-1">{avatarError}</div>
              )}
            </div>
            {/* Name */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Name</div>
              {editingName ? (
                <form onSubmit={handleUpdateName} className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={nameLoading || !newName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingName(false)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base">{userName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingName(true);
                      setNewName(userName);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
              {nameError && (
                <div className="text-xs text-red-500 mt-1">{nameError}</div>
              )}
            </div>
            {/* Email */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <div className="font-mono text-base">{userEmail}</div>
            </div>
            {/* Change password */}
            <form onSubmit={handleChangePassword} className="space-y-2">
              <div className="text-xs text-muted-foreground mb-1">
                Change Password
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                minLength={6}
                required
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  passwordLoading || !password.trim() || !confirmPassword.trim()
                }
              >
                Update Password
              </Button>
              {passwordError && (
                <div className="text-xs text-red-500">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="text-xs text-green-600">{passwordSuccess}</div>
              )}
            </form>
          </div>
          <DialogFooter className="mt-8">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
