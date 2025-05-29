// app/(auth)/complete-profile/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "">("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!id || !fullName || !role) {
      setError("Please fill in all fields");
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id,
      email,
      full_name: fullName,
      role,
      grade_level: role === "student" ? gradeLevel : null,
    });

    if (insertError) {
      setError("Failed to complete profile");
    } else {
      router.push(role === "teacher" ? "/teacher" : "/student");
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[500px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete your profile</h1>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(val) => setRole(val as any)}
              className="flex gap-4"
            >
              <RadioGroupItem value="student" id="student" />
              <Label htmlFor="student">Student</Label>
              <RadioGroupItem value="teacher" id="teacher" />
              <Label htmlFor="teacher">Teacher</Label>
            </RadioGroup>
          </div>

          {role === "student" && (
            <div>
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "k",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11",
                    "12",
                  ].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g === "k" ? "Kindergarten" : `${g}th Grade`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button onClick={handleComplete}>Finish Setup</Button>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfile() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <ProfileForm />
    </Suspense>
  );
}
