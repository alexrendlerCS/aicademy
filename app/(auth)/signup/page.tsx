"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  School,
  AlertCircle,
  BookOpen,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "">("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!fullName || !email || !password || !role) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (role === "student" && !gradeLevel) {
      setError("Please select your grade level");
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Step 1: Sign up and store metadata in Supabase Auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            grade_level: role === "student" ? gradeLevel : null,
          },
        },
      });

      if (signUpError) throw signUpError;

      // ✅ Step 2: Redirect to login with message
      router.push("/login?error=email_not_confirmed");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[500px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-sm text-muted-foreground">
            Join AIcademy to start your personalized learning experience
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    className="pl-9"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label>I am a</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as "student" | "teacher")
                  }
                  className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="student" id="student" />
                    <Label
                      htmlFor="student"
                      className="flex items-center cursor-pointer"
                    >
                      <BookOpen className="mr-2 h-4 w-4 text-subject-reading" />
                      Student
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <Label
                      htmlFor="teacher"
                      className="flex items-center cursor-pointer"
                    >
                      <Users className="mr-2 h-4 w-4 text-subject-math" />
                      Teacher
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger id="gradeLevel" className="pl-9">
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="k">Kindergarten</SelectItem>
                        <SelectItem value="1">1st Grade</SelectItem>
                        <SelectItem value="2">2nd Grade</SelectItem>
                        <SelectItem value="3">3rd Grade</SelectItem>
                        <SelectItem value="4">4th Grade</SelectItem>
                        <SelectItem value="5">5th Grade</SelectItem>
                        <SelectItem value="6">6th Grade</SelectItem>
                        <SelectItem value="7">7th Grade</SelectItem>
                        <SelectItem value="8">8th Grade</SelectItem>
                        <SelectItem value="9">9th Grade</SelectItem>
                        <SelectItem value="10">10th Grade</SelectItem>
                        <SelectItem value="11">11th Grade</SelectItem>
                        <SelectItem value="12">12th Grade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <span className="text-xs">
            By signing up, you agree to our{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
