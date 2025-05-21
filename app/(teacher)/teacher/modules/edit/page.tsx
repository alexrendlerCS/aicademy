"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Edit,
  Eye,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ModuleCard } from "@/components/module-card";

export default function EditModulePage({ params }: { params: { id: string } }) {
  const moduleId = params.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

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

  // Track deleted lessons/questions
  const [deletedLessonIds, setDeletedLessonIds] = useState<string[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);

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
        .select("class_id, student_id")
        .eq("module_id", moduleId);
      setSelectedClassIds(
        (assignmentData || []).filter((a) => a.class_id).map((a) => a.class_id)
      );
      setSelectedStudentIds(
        (assignmentData || [])
          .filter((a) => a.student_id)
          .map((a) => a.student_id)
      );
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
        studentsObj[cls.id] = (memberData || []).map((m) => m.users);
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
                  id: undefined,
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
              quizQuestions: lesson.quizQuestions.map((q) =>
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
              quizQuestions: lesson.quizQuestions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((opt, idx) =>
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
              quizQuestions: lesson.quizQuestions.filter((q) => {
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
              content: lesson.content,
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
              content: lesson.content,
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
          if (question.id) {
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
        });
      }
      for (const studentId of selectedStudentIds) {
        await supabase.from("module_assignments").insert({
          module_id: moduleId,
          student_id: studentId,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teacher/modules">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Module</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePublish} disabled={publishing}>
            <Save className="mr-2 h-4 w-4" />
            {publishing ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleDelete(moduleId)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete module</span>
          </Button>
        </div>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={moduleSubject} onValueChange={setModuleSubject}>
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
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="multiple" className="w-full">
                {lessons.map((lesson, index) => (
                  <AccordionItem
                    key={lesson.id || index}
                    value={lesson.id || `new-${index}`}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <span>{lesson.title || `Lesson ${index + 1}`}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-2 flex-1">
                            <Label
                              htmlFor={`lesson-title-${lesson.id || index}`}
                            >
                              Lesson Title
                            </Label>
                            <Input
                              id={`lesson-title-${lesson.id || index}`}
                              value={lesson.title}
                              onChange={(e) =>
                                updateLesson(lesson.id, "title", e.target.value)
                              }
                              placeholder={`Lesson ${index + 1} Title`}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeLesson(lesson.id)}
                            disabled={lessons.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove lesson</span>
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`lesson-content-${lesson.id || index}`}
                          >
                            Lesson Content
                          </Label>
                          <div className="border rounded-md p-1">
                            <Textarea
                              id={`lesson-content-${lesson.id || index}`}
                              value={lesson.content}
                              onChange={(e) =>
                                updateLesson(
                                  lesson.id,
                                  "content",
                                  e.target.value
                                )
                              }
                              placeholder="Enter lesson content here..."
                              rows={8}
                              className="border-none focus-visible:ring-0 resize-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Quiz Questions</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addQuizQuestion(lesson.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Question
                            </Button>
                          </div>
                          {lesson.quizQuestions.length > 0 ? (
                            <div className="space-y-6">
                              {lesson.quizQuestions.map((question, qIndex) => (
                                <div
                                  key={question.id || qIndex}
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
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">
                                        Remove question
                                      </span>
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`question-${
                                        lesson.id || index
                                      }-${question.id || qIndex}`}
                                    >
                                      Question
                                    </Label>
                                    <Input
                                      id={`question-${lesson.id || index}-${
                                        question.id || qIndex
                                      }`}
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
                                          val
                                        )
                                      }
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
                                              id={`option-${
                                                lesson.id || index
                                              }-${
                                                question.id || qIndex
                                              }-${oIndex}`}
                                              name={`question-${
                                                lesson.id || index
                                              }-${question.id || qIndex}`}
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
                                              className="h-4 w-4 text-primary"
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
                                              className="flex-1"
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Label>Correct Answer</Label>
                                      <Input
                                        value={question.correctAnswerText || ""}
                                        onChange={(e) =>
                                          updateQuizQuestion(
                                            lesson.id,
                                            question.id,
                                            "correctAnswerText",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter the correct answer"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
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
              <Button variant="outline" className="w-full" onClick={addLesson}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Assign Module</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assign to Classes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2">
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
                      />
                      {cls.name}
                    </label>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(studentsByClass).map(([classId, students]) =>
                    students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            setSelectedStudentIds((ids) =>
                              e.target.checked
                                ? [...ids, student.id]
                                : ids.filter((id) => id !== student.id)
                            );
                          }}
                        />
                        {student.full_name || student.email}
                      </label>
                    ))
                  )}
                  {Object.values(studentsByClass).flat().length === 0 && (
                    <span className="text-muted-foreground">
                      No students found.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
