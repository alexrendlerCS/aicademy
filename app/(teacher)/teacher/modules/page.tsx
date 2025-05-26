"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModuleCard } from "@/components/module-card";
import { PlusCircle, Search, Edit, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherModules() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    const fetchModules = async () => {
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
      const { data, error: modulesError } = await supabase
        .from("modules")
        .select("*, lessons(id)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      if (modulesError) {
        setError("Could not fetch modules.");
        setLoading(false);
        return;
      }
      // Process modules to include lesson count
      const processedModules = (data || []).map((module) => ({
        ...module,
        lessonCount: module.lessons ? module.lessons.length : 0,
      }));
      setModules(processedModules);
      setLoading(false);
    };
    fetchModules();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (!error) {
      setModules((prev) => prev.filter((m) => m.id !== id));
    } else {
      alert("Failed to delete module.");
    }
  };

  // Filter and search logic
  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      !search ||
      module.title.toLowerCase().includes(search.toLowerCase()) ||
      module.description.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      !subjectFilter ||
      subjectFilter === "all" ||
      module.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Modules</h1>
          <p className="text-muted-foreground">
            Manage and organize your educational modules
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/teacher/modules/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Module
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search modules..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="math">Math</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="geography">Geography</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div>Loading modules...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              subject={module.subject}
              description={module.description}
              lessonCount={module.lessonCount}
              userType="teacher"
            />
          ))}
          {filteredModules.length === 0 && <div>No modules found.</div>}
        </div>
      )}
    </div>
  );
}
