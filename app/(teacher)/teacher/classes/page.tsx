"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Mail, Check, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isDemoUser } from "@/lib/utils";

function generateClassCode() {
  // Simple random code generator (6 alphanumeric chars)
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, any[]>>({});
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudentClassId, setAddingStudentClassId] = useState<
    string | null
  >(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isDemo = isDemoUser(currentUser?.id);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchClassesAndMemberships = async () => {
      setLoading(true);
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Could not get current user.");
        setLoading(false);
        return;
      }
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      if (classError) {
        setError("Could not fetch classes.");
        setLoading(false);
        return;
      }
      setClasses(classData || []);
      // Fetch memberships for each class
      const membershipsObj: Record<string, any[]> = {};
      for (const cls of classData || []) {
        const { data: memberData } = await supabase
          .from("class_memberships")
          .select("*, users:student_id(full_name, email)")
          .eq("class_id", cls.id);
        membershipsObj[cls.id] = memberData || [];
      }
      setMemberships(membershipsObj);
      setLoading(false);
    };
    fetchClassesAndMemberships();
  }, [creating, refresh]);

  const handleCreateClass = async () => {
    if (isDemo) {
      setError("Demo accounts cannot create classes.");
      return;
    }
    if (!newClassName.trim()) {
      setError("Class name is required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not get current user.");
      const code = generateClassCode();
      const { error: insertError } = await supabase.from("classes").insert({
        name: newClassName,
        code,
        teacher_id: user.id,
      });
      if (insertError) throw new Error("Failed to create class.");
      setNewClassName("");
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating class.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddStudent = async (classId: string) => {
    if (isDemo) {
      setError("Demo accounts cannot add students.");
      return;
    }
    if (!studentEmail.trim()) {
      setError("Student email is required.");
      return;
    }
    setAddingStudentClassId(classId);
    setError(null);
    try {
      // Find student by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role")
        .eq("email", studentEmail.trim())
        .single();
      if (userError || !userData || userData.role !== "student")
        throw new Error("No student found with that email.");
      // Add membership as pending
      const { error: insertError } = await supabase
        .from("class_memberships")
        .insert({
          class_id: classId,
          student_id: userData.id,
          status: "pending",
        });
      if (insertError) throw new Error("Failed to add student to class.");
      setStudentEmail("");
      setRefresh((r) => r + 1);
    } catch (err: any) {
      setError(err.message || "An error occurred while adding student.");
    } finally {
      setAddingStudentClassId(null);
    }
  };

  const handleApprove = async (membershipId: string) => {
    if (isDemo) return;
    await supabase
      .from("class_memberships")
      .update({ status: "approved" })
      .eq("id", membershipId);
    setRefresh((r) => r + 1);
  };
  const handleDeny = async (membershipId: string) => {
    if (isDemo) return;
    await supabase.from("class_memberships").delete().eq("id", membershipId);
    setRefresh((r) => r + 1);
  };
  const handleRemove = async (membershipId: string) => {
    if (isDemo) return;
    await supabase.from("class_memberships").delete().eq("id", membershipId);
    setRefresh((r) => r + 1);
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800">
            This is a demo account. You can explore the interface and see how it
            works, but you cannot create classes or manage students.
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  {isDemo
                    ? "Demo accounts cannot create classes, but you can explore how the interface works."
                    : "Enter a name for your new class. A unique class code will be generated automatically."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Enter class name..."
                    disabled={isDemo}
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setError(null);
                    setNewClassName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClass}
                  disabled={creating || isDemo}
                >
                  {creating ? "Creating..." : "Create Class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {loading ? (
        <div>Loading classes...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => {
            const classMembers = memberships[cls.id] || [];
            const pending = classMembers.filter((m) => m.status === "pending");
            const approved = classMembers.filter(
              (m) => m.status === "approved"
            );
            return (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cls.name}</span>
                    <Badge variant="outline">{cls.code}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" /> Pending Requests
                    </h4>
                    {pending.length === 0 ? (
                      <div className="text-muted-foreground text-sm">None</div>
                    ) : (
                      <ul className="space-y-1 bg-muted/50 rounded p-2">
                        {pending.map((m) => (
                          <li key={m.id} className="flex items-center gap-2">
                            <Badge variant="outline">
                              {m.users?.full_name ||
                                m.users?.email ||
                                "Unknown"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApprove(m.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve"
                              disabled={isDemo}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeny(m.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Deny"
                              disabled={isDemo}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" /> Approved Students
                    </h4>
                    {approved.length === 0 ? (
                      <div className="text-muted-foreground text-sm">None</div>
                    ) : (
                      <ul className="space-y-1 bg-muted/50 rounded p-2">
                        {approved.map((m) => (
                          <li key={m.id} className="flex items-center gap-2">
                            <Badge variant="outline">
                              {m.users?.full_name ||
                                m.users?.email ||
                                "Unknown"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleRemove(m.id)}
                              title="Remove"
                              disabled={isDemo}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Student by Email
                    </h4>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Student email"
                        value={
                          addingStudentClassId === cls.id ? studentEmail : ""
                        }
                        onChange={(e) => setStudentEmail(e.target.value)}
                        disabled={
                          isDemo ||
                          (addingStudentClassId !== null &&
                            addingStudentClassId !== cls.id)
                        }
                      />
                      <Button
                        onClick={() => handleAddStudent(cls.id)}
                        disabled={
                          isDemo ||
                          (addingStudentClassId !== null &&
                            addingStudentClassId !== cls.id)
                        }
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredClasses.length === 0 && <div>No classes found.</div>}
        </div>
      )}
    </div>
  );
}
