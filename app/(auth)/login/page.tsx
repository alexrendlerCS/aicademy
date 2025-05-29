"use client";

import type React from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";

// Separate component for the form that uses searchParams
function LoginFormWithParams() {
  const searchParams = useSearchParams();
  const emailError = searchParams.get("error") === "email_not_confirmed";
  const intendedRole = searchParams.get("role");
  return <LoginForm emailError={emailError} intendedRole={intendedRole} />;
}

// Main form component that receives params as props
function LoginForm({
  emailError,
  intendedRole,
}: {
  emailError: boolean;
  intendedRole: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign in with Supabase Auth
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError || !data.user) {
        if (
          loginError?.message?.toLowerCase().includes("email not confirmed")
        ) {
          router.push("/login?error=email_not_confirmed");
          return;
        }

        throw loginError || new Error("Login failed");
      }

      const user = data.user;
      const userId = user.id;

      // 2. Check if user exists in 'users' table
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        // If it's NOT the "no rows found" error, throw it
        throw checkError;
      }

      // 3. If not in users table, insert using metadata
      if (!existingUser) {
        const metadata = user.user_metadata;

        // Check for required metadata fields
        if (!metadata.full_name || !metadata.role) {
          // Redirect to profile completion page with user ID and email as params
          router.push(
            `/complete-profile?id=${userId}&email=${encodeURIComponent(
              user.email ?? ""
            )}`
          );
          return;
        }

        // Proceed with insert if metadata is valid
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          full_name: metadata.full_name,
          email: user.email,
          role: metadata.role,
          grade_level: metadata.grade_level || null,
        });

        if (insertError) {
          throw insertError;
        }
      }

      // 4. Fetch role from users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !profile) {
        throw profileError || new Error("User role not found");
      }

      // 5. Enforce role-based login
      if (intendedRole && profile.role !== intendedRole) {
        setError(
          `You are trying to log in as a ${intendedRole}, but your account is registered as a ${profile.role}. Please use the correct login button or contact support if this is an error.`
        );
        setIsLoading(false);
        return;
      }

      // 6. Redirect based on role
      if (profile.role === "teacher") {
        router.push("/teacher");
      } else if (profile.role === "student") {
        router.push("/student");
      } else {
        throw new Error("Unknown user role");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to AIcademy</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue your learning journey
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Log in</CardTitle>
            <CardDescription>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {emailError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please check your inbox to confirm your email before logging
                  in.
                  <br />
                  Didn't get it?{" "}
                  <button
                    className="text-primary underline"
                    onClick={async () => {
                      const { error } = await supabase.auth.resend({
                        type: "signup",
                        email,
                      });
                      if (error) {
                        setError("Failed to resend email. Try again later.");
                      } else {
                        alert("Confirmation email resent!");
                      }
                    }}
                  >
                    Resend email
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal leading-none"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <LoginFormWithParams />
    </Suspense>
  );
}
