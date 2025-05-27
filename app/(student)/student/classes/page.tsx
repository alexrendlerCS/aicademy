"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

type Class = any & {
  membership: {
    status: string;
  };
};

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch classes with teacher name using the class_with_teacher view
      const { data: classes, error } = await supabase
        .from("class_with_teacher")
        .select(
          `
          *,
          class_memberships!inner(status)
        `
        )
        .eq("class_memberships.student_id", user.id);

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      console.log("Raw classes data from query:", classes);

      // For each class, fetch module count
      const classesWithModules = await Promise.all(
        (classes || []).map(async (cls) => {
          console.log("Processing class:", cls);

          // Count modules assigned to this class
          const { count: moduleCount } = await supabase
            .from("module_assignments")
            .select("id", { count: "exact", head: true })
            .eq("class_id", cls.id);

          const processedClass = {
            ...cls,
            membership: cls.class_memberships[0],
            teacherName: cls.teacher_name || "Unknown Teacher",
            moduleCount: moduleCount || 0,
          };

          console.log("Processed class with teacher:", processedClass);
          return processedClass;
        })
      );

      console.log("Final classes with modules:", classesWithModules);
      setClasses(classesWithModules);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinClassByCode = async () => {
    toast.dismiss();
    if (!classCode.trim()) {
      toast.error("Please enter a class code.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Find the class with the given code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classCode.trim())
        .single();

      if (classError || !classData) {
        toast.error(
          "No class found with that code. Please check and try again."
        );
        return;
      }

      // Check if already a member or pending
      const { data: existingMembership } = await supabase
        .from("class_memberships")
        .select("id, status")
        .eq("class_id", classData.id)
        .eq("student_id", user.id)
        .single();

      if (existingMembership) {
        if (existingMembership.status === "pending") {
          toast.error(
            "You have already requested to join this class. Please wait for approval."
          );
        } else {
          toast.error("You are already a member of this class.");
        }
        return;
      }

      // Create membership request
      const { error: membershipError } = await supabase
        .from("class_memberships")
        .insert({
          class_id: classData.id,
          student_id: user.id,
          status: "pending",
        });

      if (membershipError) throw membershipError;

      setIsDialogOpen(false);
      fetchClasses(); // Refresh the classes list

      // Show the success toast after dialog closes
      setTimeout(() => {
        toast.success(
          "Join request sent! Your request is now pending teacher approval."
        );
      }, 300);
    } catch (error) {
      toast.error("Failed to join class. Please try again later.");
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {/* Header row: title and join button */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
          <h1 className="text-3xl font-bold">My Classes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-2 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                Join Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Join a Class</DialogTitle>
                <DialogDescription>
                  Enter a class code to request to join the class.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter class code"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                  />
                  <Button onClick={joinClassByCode} className="w-full">
                    Request to Join Class
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Search bar below header row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
            <span className="text-lg font-semibold">
              You are not enrolled in any classes yet.
            </span>
            <span className="text-base">
              Click <span className="font-bold">Join Class</span> to get
              started!
            </span>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary"
                tabIndex={0}
                onClick={() => {
                  // Navigate to modules page with class filter pre-selected
                  router.push(
                    `/student/modules?filterType=class&classId=${cls.id}`
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(
                      `/student/modules?filterType=class&classId=${cls.id}`
                    );
                  }
                }}
                role="button"
                aria-label={`View modules for class ${cls.name}`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="text-xl font-bold leading-tight">
                      {cls.name}
                    </div>
                    <div className="text-base text-muted-foreground line-clamp-2">
                      {cls.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="default"
                    className={getStatusColor(cls.membership.status)}
                  >
                    {cls.membership.status.charAt(0).toUpperCase() +
                      cls.membership.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex flex-col mt-2 text-sm gap-1">
                  <span className="font-medium">
                    Teacher: {cls.teacherName}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    <span>
                      {cls.moduleCount}{" "}
                      {cls.moduleCount === 1 ? "Module" : "Modules"}
                    </span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Class Code: {cls.code}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
