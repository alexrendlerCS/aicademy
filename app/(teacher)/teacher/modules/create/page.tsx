"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabaseClient";
import { RichTextEditor } from "@/components/rich-text-editor";

interface Lesson {
  id: string;
  title: string;
  content: string;
  quizQuestions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "free_response";
  options: string[];
  correctOption: number;
  correctAnswerText?: string;
}

export default function CreateModule() {
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubject, setModuleSubject] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: "1",
      title: "",
      content: "",
      quizQuestions: [],
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState("published");
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

  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;
      // Fetch classes
      const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);
      setClasses(classData || []);
      // Fetch approved students for each class
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
    };
    fetchClassesAndStudents();
  }, []);

  const addLesson = () => {
    setLessons([
      ...lessons,
      {
        id: `${lessons.length + 1}`,
        title: "",
        content: "",
        quizQuestions: [],
      },
    ]);
  };

  const removeLesson = (id: string) => {
    if (lessons.length > 1) {
      setLessons(lessons.filter((lesson) => lesson.id !== id));
    }
  };

  const updateLesson = (id: string, field: keyof Lesson, value: any) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, [field]: value } : lesson
      )
    );
  };

  const addQuizQuestion = (lessonId: string) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: [
                ...lesson.quizQuestions,
                {
                  id: `${lesson.quizQuestions.length + 1}`,
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
    field: keyof QuizQuestion,
    value: any
  ) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((question) =>
                question.id === questionId
                  ? { ...question, [field]: value }
                  : question
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
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      options: question.options.map((option, index) =>
                        index === optionIndex ? value : option
                      ),
                    }
                  : question
              ),
            }
          : lesson
      )
    );
  };

  const removeQuizQuestion = (lessonId: string, questionId: string) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.filter(
                (question) => question.id !== questionId
              ),
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
          if (!question.options.every((opt) => opt.trim())) {
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
      // Get current user (teacher)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not get current user.");
      // Insert module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .insert({
          title: moduleTitle,
          subject: moduleSubject,
          description: moduleDescription,
          teacher_id: user.id,
          status,
          visibility: "all",
        })
        .select()
        .single();
      if (moduleError || !moduleData)
        throw new Error("Failed to create module.");
      // Insert lessons
      for (const [orderIndex, lesson] of lessons.entries()) {
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .insert({
            module_id: moduleData.id,
            title: lesson.title,
            content: lesson.content,
            order_index: orderIndex,
          })
          .select()
          .single();
        if (lessonError || !lessonData)
          throw new Error("Failed to create lesson.");
        // Insert quiz questions for this lesson
        for (const question of lesson.quizQuestions) {
          const insertObj: any = {
            lesson_id: lessonData.id,
            question: question.question,
            type: question.type,
          };
          if (question.type === "multiple_choice") {
            insertObj.options = question.options;
            insertObj.correct_index = question.correctOption;
            insertObj.correct_answer_text = null;
          } else if (question.type === "free_response") {
            insertObj.options = null;
            insertObj.correct_index = null;
            insertObj.correct_answer_text = question.correctAnswerText;
          }
          const { error: questionError } = await supabase
            .from("quiz_questions")
            .insert(insertObj);
          if (questionError) throw new Error("Failed to create quiz question.");
        }
      }
      // Insert module assignments
      for (const classId of selectedClassIds) {
        await supabase.from("module_assignments").insert({
          module_id: moduleData.id,
          class_id: classId,
          assigned_by: user.id,
          due_date: classDueDates[classId]
            ? new Date(classDueDates[classId]).toISOString()
            : null,
        });
      }
      for (const studentId of selectedStudentIds) {
        await supabase.from("module_assignments").insert({
          module_id: moduleData.id,
          student_id: studentId,
          assigned_by: user.id,
          due_date: studentDueDates[studentId]
            ? new Date(studentDueDates[studentId]).toISOString()
            : null,
        });
      }

      // --- NEW: Insert into student_modules for all assigned students ---
      // 1. Collect all assigned student IDs (from classes and individual)
      let allAssignedStudentIds = new Set(selectedStudentIds);
      // For each selected class, get approved students
      for (const classId of selectedClassIds) {
        const { data: memberData } = await supabase
          .from("class_memberships")
          .select("student_id")
          .eq("class_id", classId)
          .eq("status", "approved");
        (memberData || []).forEach((m) => {
          if (m.student_id) allAssignedStudentIds.add(m.student_id);
        });
      }
      // 2. For each student, insert into student_modules if not already present
      for (const studentId of allAssignedStudentIds) {
        // Check if already exists
        const { data: existing } = await supabase
          .from("student_modules")
          .select("id")
          .eq("student_id", studentId)
          .eq("module_id", moduleData.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("student_modules").insert({
            student_id: studentId,
            module_id: moduleData.id,
            progress: 0,
          });
        }
      }
      // --- END NEW ---

      setSuccess("Module published and assigned successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred while publishing.");
    } finally {
      setPublishing(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Create Module</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handlePublish} disabled={publishing}>
            <Save className="mr-2 h-4 w-4" />
            {publishing ? "Publishing..." : "Publish"}
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
              <Separator />
              <div className="mb-2 text-sm text-muted-foreground">
                Assign this module to classes or individual students and set a
                due date for each assignment.
              </div>
              <div>
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
                <Label>Assign to Individual Students (Coming soon)</Label>
                <div className="flex flex-col gap-3 mt-2">
                  {Object.entries(studentsByClass).map(([classId, students]) =>
                    students.map((student) =>
                      student ? (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-2 bg-muted/30 rounded"
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
                          <span className="font-medium">
                            {student.full_name || student.email}
                          </span>
                          {selectedStudentIds.includes(student.id) && (
                            <div className="flex items-center gap-2 ml-4">
                              <Label htmlFor={`due-date-student-${student.id}`}>
                                Due Date
                              </Label>
                              <Input
                                id={`due-date-student-${student.id}`}
                                type="datetime-local"
                                className="w-56"
                                value={studentDueDates[student.id] || ""}
                                onChange={(e) =>
                                  setStudentDueDates((prev) => ({
                                    ...prev,
                                    [student.id]: e.target.value,
                                  }))
                                }
                                placeholder="Due date"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="multiple" className="w-full">
                {lessons.map((lesson, index) => (
                  <AccordionItem key={lesson.id} value={lesson.id}>
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
                            <Label htmlFor={`lesson-title-${lesson.id}`}>
                              Lesson Title
                            </Label>
                            <Input
                              id={`lesson-title-${lesson.id}`}
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
                          <Label htmlFor={`lesson-content-${lesson.id}`}>
                            Lesson Content
                          </Label>
                          <div className="border rounded-md">
                            <RichTextEditor
                              content={lesson.content}
                              onChange={(value) =>
                                updateLesson(lesson.id, "content", value)
                              }
                              placeholder={`Enter content for Lesson ${
                                index + 1
                              }...`}
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
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">
                                        Remove question
                                      </span>
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`question-${lesson.id}-${question.id}`}
                                    >
                                      Question
                                    </Label>
                                    <Input
                                      id={`question-${lesson.id}-${question.id}`}
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
                                          val as any
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
                                        (option, oIndex) => (
                                          <div
                                            key={oIndex}
                                            className="flex items-center gap-2"
                                          >
                                            <input
                                              type="radio"
                                              id={`option-${lesson.id}-${question.id}-${oIndex}`}
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
                      <li key={lesson.id} className="flex items-center gap-2">
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
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="specific">Specific Classes</SelectItem>
                    <SelectItem value="individual">
                      Individual Students
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
