"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

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
  const [memberships, setMemberships] = useState<Record<string, any[]>>({});
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudentClassId, setAddingStudentClassId] = useState<
    string | null
  >(null);
  const [refresh, setRefresh] = useState(0);

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
    } catch (err: any) {
      setError(err.message || "An error occurred while creating class.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddStudent = async (classId: string) => {
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
    await supabase
      .from("class_memberships")
      .update({ status: "approved" })
      .eq("id", membershipId);
    setRefresh((r) => r + 1);
  };
  const handleDeny = async (membershipId: string) => {
    await supabase.from("class_memberships").delete().eq("id", membershipId);
    setRefresh((r) => r + 1);
  };
  const handleRemove = async (membershipId: string) => {
    await supabase.from("class_memberships").delete().eq("id", membershipId);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            disabled={creating}
          />
          <Button onClick={handleCreateClass} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Create Class"}
          </Button>
        </div>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {loading ? (
        <div>Loading classes...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const classMembers = memberships[cls.id] || [];
            const pending = classMembers.filter((m) => m.status === "pending");
            const approved = classMembers.filter(
              (m) => m.status === "approved"
            );
            return (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    Class Code:{" "}
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      {cls.code}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold">Pending Students</h4>
                    {pending.length === 0 ? (
                      <div className="text-muted-foreground text-sm">None</div>
                    ) : (
                      <ul className="space-y-1">
                        {pending.map((m) => (
                          <li key={m.id} className="flex items-center gap-2">
                            <span>
                              {m.users?.full_name ||
                                m.users?.email ||
                                "Unknown"}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(m.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeny(m.id)}
                            >
                              Deny
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold">Approved Students</h4>
                    {approved.length === 0 ? (
                      <div className="text-muted-foreground text-sm">None</div>
                    ) : (
                      <ul className="space-y-1">
                        {approved.map((m) => (
                          <li key={m.id} className="flex items-center gap-2">
                            <span>
                              {m.users?.full_name ||
                                m.users?.email ||
                                "Unknown"}
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemove(m.id)}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold">Add Student by Email</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Student email"
                        value={
                          addingStudentClassId === cls.id ? studentEmail : ""
                        }
                        onChange={(e) => setStudentEmail(e.target.value)}
                        disabled={
                          addingStudentClassId !== null &&
                          addingStudentClassId !== cls.id
                        }
                      />
                      <Button
                        onClick={() => handleAddStudent(cls.id)}
                        disabled={
                          addingStudentClassId !== null &&
                          addingStudentClassId !== cls.id
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
          {classes.length === 0 && <div>No classes found.</div>}
        </div>
      )}
    </div>
  );
}
