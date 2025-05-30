"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SubjectIcon } from "@/components/subject-icon";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/rich-text-editor";
import { isDemoUser } from "@/lib/utils";

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: moduleId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { message: string } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isDemo = isDemoUser(currentUser?.id);

  // Module state
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubject, setModuleSubject] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [status, setStatus] = useState("published");
  const [lessons, setLessons] = useState<any[]>([]);

  // Assignment state
  const [classes, setClasses] = useState<any[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, any[]>>(
    {}
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [classDueDates, setClassDueDates] = useState<Record<string, string>>(
    {}
  );
  const [studentDueDates, setStudentDueDates] = useState<
    Record<string, string>
  >({});

  // Track deleted lessons/questions
  const [deletedLessonIds, setDeletedLessonIds] = useState<string[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);

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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Fetch module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      if (moduleError || !moduleData) {
        setError("Module not found.");
        setLoading(false);
        return;
      }
      setModuleTitle(moduleData.title);
      setModuleSubject(moduleData.subject);
      setModuleDescription(moduleData.description);
      setStatus(moduleData.status);
      // Fetch lessons
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*, quiz_questions(*)")
        .eq("module_id", moduleId)
        .order("order_index");
      setLessons(
        (lessonData || []).map((lesson: any) => ({
          ...lesson,
          quizQuestions: (lesson.quiz_questions || []).map((q: any) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options || ["", "", "", ""],
            correctOption: q.correct_index ?? 0,
            correctAnswerText: q.correct_answer_text || "",
          })),
        }))
      );
      // Fetch assignments
      const { data: assignmentData } = await supabase
        .from("module_assignments")
        .select("class_id, student_id, due_date")
        .eq("module_id", moduleId);
      setSelectedClassIds(
        (assignmentData || []).filter((a) => a.class_id).map((a) => a.class_id)
      );
      setSelectedStudentIds(
        (assignmentData || [])
          .filter((a) => a.student_id)
          .map((a) => a.student_id)
      );
      // NEW: Set due dates
      const classDue: Record<string, string> = {};
      const studentDue: Record<string, string> = {};
      (assignmentData || []).forEach((a) => {
        if (a.class_id)
          classDue[a.class_id] = a.due_date ? a.due_date.slice(0, 16) : "";
        if (a.student_id)
          studentDue[a.student_id] = a.due_date ? a.due_date.slice(0, 16) : "";
      });
      setClassDueDates(classDue);
      setStudentDueDates(studentDue);
      // Fetch classes and students
      const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", moduleData.teacher_id);
      setClasses(classData || []);
      const studentsObj: Record<string, any[]> = {};
      for (const cls of classData || []) {
        const { data: memberData } = await supabase
          .from("class_memberships")
          .select("*, users:student_id(full_name, email)")
          .eq("class_id", cls.id)
          .eq("status", "approved");
        studentsObj[cls.id] = (memberData || [])
          .map((m) => m.users)
          .filter(Boolean);
      }
      setStudentsByClass(studentsObj);
      setLoading(false);
    };
    fetchData();
  }, [moduleId]);

  // Lesson/quiz logic (reuse from create page)
  const addLesson = () => {
    setLessons([
      ...lessons,
      {
        id: undefined, // undefined means new lesson
        title: "",
        content: "",
        quizQuestions: [],
      },
    ]);
  };
  const removeLesson = (id: string) => {
    setLessons((prev) => {
      const lesson = prev.find((l) => l.id === id);
      if (lesson && lesson.id) setDeletedLessonIds((d) => [...d, lesson.id]);
      return prev.filter((lesson) => lesson.id !== id);
    });
  };
  const updateLesson = (id: string, field: string, value: any) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === id ? { ...lesson, [field]: value } : lesson
      )
    );
  };
  const addQuizQuestion = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: [
                ...lesson.quizQuestions,
                {
                  id: `new-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  question: "",
                  type: "multiple_choice",
                  options: ["", "", "", ""],
                  correctOption: 0,
                  correctAnswerText: "",
                },
              ],
            }
          : lesson
      )
    );
  };
  const updateQuizQuestion = (
    lessonId: string,
    questionId: string,
    field: string,
    value: any
  ) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((q: any) =>
                q.id === questionId ? { ...q, [field]: value } : q
              ),
            }
          : lesson
      )
    );
  };
  const updateQuizOption = (
    lessonId: string,
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((q: any) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((opt: string, idx: number) =>
                        idx === optionIndex ? value : opt
                      ),
                    }
                  : q
              ),
            }
          : lesson
      )
    );
  };
  const removeQuizQuestion = (lessonId: string, questionId: string) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.filter((q: any) => {
                if (q.id === questionId && q.id)
                  setDeletedQuestionIds((d) => [...d, q.id]);
                return q.id !== questionId;
              }),
            }
          : lesson
      )
    );
  };
  const validate = () => {
    if (
      !moduleTitle.trim() ||
      !moduleSubject.trim() ||
      !moduleDescription.trim()
    ) {
      setError("Module title, subject, and description are required.");
      return false;
    }
    for (const lesson of lessons) {
      if (!lesson.title.trim() || !lesson.content.trim()) {
        setError("Each lesson must have a title and content.");
        return false;
      }
      for (const question of lesson.quizQuestions) {
        if (!question.question.trim()) {
          setError("Each quiz question must have a question text.");
          return false;
        }
        if (question.type === "multiple_choice") {
          if (!question.options.every((opt: string) => opt.trim())) {
            setError(
              "All answer options must be filled for each multiple choice question."
            );
            return false;
          }
          if (
            typeof question.correctOption !== "number" ||
            question.correctOption < 0 ||
            question.correctOption >= question.options.length
          ) {
            setError(
              "A correct answer must be selected for each multiple choice question."
            );
            return false;
          }
        } else if (question.type === "free_response") {
          if (
            !question.correctAnswerText ||
            !question.correctAnswerText.trim()
          ) {
            setError(
              "A correct answer must be provided for each free response question."
            );
            return false;
          }
        }
      }
    }
    setError(null);
    return true;
  };

  const handlePublish = async () => {
    setSuccess(null);
    if (!validate()) return;
    setPublishing(true);
    setError(null);
    try {
      // Update module
      const { error: moduleError } = await supabase
        .from("modules")
        .update({
          title: moduleTitle,
          subject: moduleSubject,
          description: moduleDescription,
          status,
        })
        .eq("id", moduleId);
      if (moduleError) throw new Error("Failed to update module.");
      // Handle lessons
      for (const [orderIndex, lesson] of lessons.entries()) {
        if (lesson.id) {
          // Update existing lesson
          const { error: lessonError } = await supabase
            .from("lessons")
            .update({
              title: lesson.title,
              content: lesson.content.replace(/\\"/g, '"').replace(/\\'/g, "'"),
              order_index: orderIndex,
            })
            .eq("id", lesson.id);
          if (lessonError) throw new Error("Failed to update lesson.");
        } else {
          // Insert new lesson
          const { data: newLesson, error: lessonError } = await supabase
            .from("lessons")
            .insert({
              module_id: moduleId,
              title: lesson.title,
              content: lesson.content.replace(/\\"/g, '"').replace(/\\'/g, "'"),
              order_index: orderIndex,
            })
            .select()
            .single();
          if (lessonError || !newLesson)
            throw new Error("Failed to create lesson.");
          lesson.id = newLesson.id;
        }
        // Handle quiz questions
        for (const question of lesson.quizQuestions) {
          const isNewQuestion = question.id.startsWith("new-");
          if (!isNewQuestion) {
            // Update existing question
            const { error: questionError } = await supabase
              .from("quiz_questions")
              .update({
                question: question.question,
                type: question.type,
                options:
                  question.type === "multiple_choice" ? question.options : null,
                correct_index:
                  question.type === "multiple_choice"
                    ? question.correctOption
                    : null,
                correct_answer_text:
                  question.type === "free_response"
                    ? question.correctAnswerText
                    : null,
              })
              .eq("id", question.id);
            if (questionError)
              throw new Error("Failed to update quiz question.");
          } else {
            // Insert new question
            const { error: questionError } = await supabase
              .from("quiz_questions")
              .insert({
                lesson_id: lesson.id,
                question: question.question,
                type: question.type,
                options:
                  question.type === "multiple_choice" ? question.options : null,
                correct_index:
                  question.type === "multiple_choice"
                    ? question.correctOption
                    : null,
                correct_answer_text:
                  question.type === "free_response"
                    ? question.correctAnswerText
                    : null,
              });
            if (questionError)
              throw new Error("Failed to create quiz question.");
          }
        }
      }
      // Delete removed lessons and questions
      for (const lessonId of deletedLessonIds) {
        await supabase.from("lessons").delete().eq("id", lessonId);
      }
      for (const questionId of deletedQuestionIds) {
        await supabase.from("quiz_questions").delete().eq("id", questionId);
      }
      // Update assignments: remove all, then re-insert
      await supabase
        .from("module_assignments")
        .delete()
        .eq("module_id", moduleId);
      for (const classId of selectedClassIds) {
        await supabase.from("module_assignments").insert({
          module_id: moduleId,
          class_id: classId,
          due_date: classDueDates[classId]
            ? new Date(classDueDates[classId]).toISOString()
            : null,
        });
      }
      for (const studentId of selectedStudentIds) {
        await supabase.from("module_assignments").insert({
          module_id: moduleId,
          student_id: studentId,
          due_date: studentDueDates[studentId]
            ? new Date(studentDueDates[studentId]).toISOString()
            : null,
        });
      }
      setSuccess("Module updated successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (!error) {
      router.push("/teacher/modules");
    } else {
      alert("Failed to delete module.");
    }
  };

  // Render the same UI as the create page, but prefilled and with Save/Update button
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {isDemo && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800">
            This is a demo account. Module editing is disabled, but you can
            explore the interface and see how it works.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teacher/modules">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Modules</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Module</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePublish}
            disabled={publishing || isDemo}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {publishing ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleDelete(moduleId)}
            disabled={isDemo}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete module</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {typeof error === "string"
            ? error
            : error && typeof error === "object" && "message" in error
            ? (error as any).message
            : ""}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-6">
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Enter module title"
                  disabled={isDemo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={moduleSubject}
                  onValueChange={setModuleSubject}
                  disabled={isDemo}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Math</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="geography">Geography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder="Enter module description"
                  rows={4}
                  disabled={isDemo}
                />
              </div>
              <Separator />
              <div className="mb-2 text-sm text-muted-foreground">
                Assign this module to classes or individual students and set a
                due date for each assignment.
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Assign Module</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={status}
                        onValueChange={setStatus}
                        disabled={isDemo}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign to Classes</Label>
                      <div className="flex flex-col gap-3 mt-2">
                        {classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="flex items-center gap-4 p-2 bg-muted/30 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedClassIds.includes(cls.id)}
                              onChange={(e) => {
                                setSelectedClassIds((ids) =>
                                  e.target.checked
                                    ? [...ids, cls.id]
                                    : ids.filter((id) => id !== cls.id)
                                );
                              }}
                              disabled={isDemo}
                            />
                            <span className="font-medium">{cls.name}</span>
                            {selectedClassIds.includes(cls.id) && (
                              <div className="flex items-center gap-2 ml-4">
                                <Label htmlFor={`due-date-class-${cls.id}`}>
                                  Due Date
                                </Label>
                                <Input
                                  id={`due-date-class-${cls.id}`}
                                  type="datetime-local"
                                  className="w-56"
                                  value={classDueDates[cls.id] || ""}
                                  onChange={(e) =>
                                    setClassDueDates((prev) => ({
                                      ...prev,
                                      [cls.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Due date"
                                  disabled={isDemo}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {classes.length === 0 && (
                          <span className="text-muted-foreground">
                            No classes found.
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Assign to Individual Students</Label>
                      <div className="flex flex-col gap-3 mt-2">
                        {Object.entries(studentsByClass).map(
                          ([classId, students]) =>
                            students.map((student) =>
                              student ? (
                                <div
                                  key={`${classId}-${student.id}`}
                                  className="flex items-center gap-4 p-2 bg-muted/30 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedStudentIds.includes(
                                      student.id
                                    )}
                                    onChange={(e) => {
                                      setSelectedStudentIds((ids) =>
                                        e.target.checked
                                          ? [...ids, student.id]
                                          : ids.filter(
                                              (id) => id !== student.id
                                            )
                                      );
                                    }}
                                    disabled={isDemo}
                                  />
                                  <span className="font-medium">
                                    {student.full_name || student.email}
                                  </span>
                                  {selectedStudentIds.includes(student.id) && (
                                    <div className="flex items-center gap-2 ml-4">
                                      <Label
                                        htmlFor={`due-date-student-${student.id}`}
                                      >
                                        Due Date
                                      </Label>
                                      <Input
                                        id={`due-date-student-${student.id}`}
                                        type="datetime-local"
                                        className="w-56"
                                        value={
                                          studentDueDates[student.id] || ""
                                        }
                                        onChange={(e) =>
                                          setStudentDueDates((prev) => ({
                                            ...prev,
                                            [student.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Due date"
                                        disabled={isDemo}
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : null
                            )
                        )}
                        {Object.values(studentsByClass).flat().length === 0 && (
                          <span className="text-muted-foreground">
                            No students found.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lessons</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addLesson}
                disabled={isDemo}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </Button>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {lessons.map((lesson, index) => (
                  <AccordionItem key={lesson.id} value={lesson.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span>{lesson.title || `Lesson ${index + 1}`}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Lesson Title</Label>
                          <div className="flex gap-2">
                            <Input
                              value={lesson.title}
                              onChange={(e) =>
                                updateLesson(lesson.id, "title", e.target.value)
                              }
                              placeholder={`Lesson ${index + 1}`}
                              disabled={isDemo}
                            />
                            {lessons.length > 1 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeLesson(lesson.id)}
                                disabled={isDemo}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <RichTextEditor
                            content={lesson.content}
                            onChange={(value) =>
                              updateLesson(lesson.id, "content", value)
                            }
                            placeholder={`Enter content for Lesson ${
                              index + 1
                            }...`}
                            editable={!isDemo}
                          />
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Quiz Questions</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addQuizQuestion(lesson.id)}
                              disabled={isDemo}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Question
                            </Button>
                          </div>
                          {lesson.quizQuestions.length > 0 ? (
                            <div className="space-y-6">
                              {lesson.quizQuestions.map(
                                (question: any, qIndex: number) => (
                                  <div
                                    key={question.id}
                                    className="space-y-4 border rounded-md p-4"
                                  >
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">
                                        Question {qIndex + 1}
                                      </h4>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                          removeQuizQuestion(
                                            lesson.id,
                                            question.id
                                          )
                                        }
                                        disabled={isDemo}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">
                                          Remove question
                                        </span>
                                      </Button>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Question</Label>
                                      <Input
                                        value={question.question}
                                        onChange={(e) =>
                                          updateQuizQuestion(
                                            lesson.id,
                                            question.id,
                                            "question",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter question"
                                        disabled={isDemo}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Question Type</Label>
                                      <Select
                                        value={question.type}
                                        onValueChange={(val) =>
                                          updateQuizQuestion(
                                            lesson.id,
                                            question.id,
                                            "type",
                                            val as any
                                          )
                                        }
                                        disabled={isDemo}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="multiple_choice">
                                            Multiple Choice
                                          </SelectItem>
                                          <SelectItem value="free_response">
                                            Free Response
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {question.type === "multiple_choice" ? (
                                      <div className="space-y-3">
                                        <Label>Answer Options</Label>
                                        {question.options.map(
                                          (option: string, oIndex: number) => (
                                            <div
                                              key={oIndex}
                                              className="flex items-center gap-2"
                                            >
                                              <input
                                                type="radio"
                                                name={`question-${lesson.id}-${question.id}`}
                                                checked={
                                                  question.correctOption ===
                                                  oIndex
                                                }
                                                onChange={() =>
                                                  updateQuizQuestion(
                                                    lesson.id,
                                                    question.id,
                                                    "correctOption",
                                                    oIndex
                                                  )
                                                }
                                                disabled={isDemo}
                                              />
                                              <Input
                                                value={option}
                                                onChange={(e) =>
                                                  updateQuizOption(
                                                    lesson.id,
                                                    question.id,
                                                    oIndex,
                                                    e.target.value
                                                  )
                                                }
                                                placeholder={`Option ${
                                                  oIndex + 1
                                                }`}
                                                disabled={isDemo}
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Label>Correct Answer</Label>
                                        <Input
                                          value={
                                            question.correctAnswerText || ""
                                          }
                                          onChange={(e) =>
                                            updateQuizQuestion(
                                              lesson.id,
                                              question.id,
                                              "correctAnswerText",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Enter the correct answer"
                                          disabled={isDemo}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No quiz questions added yet
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moduleTitle ? (
                  <h3 className="font-semibold text-lg">{moduleTitle}</h3>
                ) : (
                  <div className="h-6 bg-muted rounded animate-pulse" />
                )}
                {moduleSubject ? (
                  <div className="flex items-center gap-2">
                    <SubjectIcon
                      subject={moduleSubject as any}
                      className="h-8 w-8"
                    />
                    <span className="capitalize">{moduleSubject}</span>
                  </div>
                ) : (
                  <div className="h-8 bg-muted rounded animate-pulse" />
                )}
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  {moduleDescription ? (
                    <p className="text-sm text-muted-foreground">
                      {moduleDescription}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Lessons</h4>
                  <ul className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <li
                        key={lesson.id || index}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs">
                          {index + 1}
                        </div>
                        <span className="text-sm">
                          {lesson.title || `Lesson ${index + 1}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
