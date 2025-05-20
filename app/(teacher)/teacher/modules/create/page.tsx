"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SubjectIcon } from "@/components/subject-icon"
import { ArrowLeft, GripVertical, Plus, Save, Trash2, Upload } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Lesson {
  id: string
  title: string
  content: string
  quizQuestions: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctOption: number
}

export default function CreateModule() {
  const [moduleTitle, setModuleTitle] = useState("")
  const [moduleSubject, setModuleSubject] = useState("")
  const [moduleDescription, setModuleDescription] = useState("")
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: "1",
      title: "",
      content: "",
      quizQuestions: [],
    },
  ])

  const addLesson = () => {
    setLessons([
      ...lessons,
      {
        id: `${lessons.length + 1}`,
        title: "",
        content: "",
        quizQuestions: [],
      },
    ])
  }

  const removeLesson = (id: string) => {
    if (lessons.length > 1) {
      setLessons(lessons.filter((lesson) => lesson.id !== id))
    }
  }

  const updateLesson = (id: string, field: keyof Lesson, value: any) => {
    setLessons(lessons.map((lesson) => (lesson.id === id ? { ...lesson, [field]: value } : lesson)))
  }

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
                  options: ["", "", "", ""],
                  correctOption: 0,
                },
              ],
            }
          : lesson,
      ),
    )
  }

  const updateQuizQuestion = (lessonId: string, questionId: string, field: keyof QuizQuestion, value: any) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((question) =>
                question.id === questionId ? { ...question, [field]: value } : question,
              ),
            }
          : lesson,
      ),
    )
  }

  const updateQuizOption = (lessonId: string, questionId: string, optionIndex: number, value: string) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      options: question.options.map((option, index) => (index === optionIndex ? value : option)),
                    }
                  : question,
              ),
            }
          : lesson,
      ),
    )
  }

  const removeQuizQuestion = (lessonId: string, questionId: string) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              quizQuestions: lesson.quizQuestions.filter((question) => question.id !== questionId),
            }
          : lesson,
      ),
    )
  }

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
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

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
                            <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson Title</Label>
                            <Input
                              id={`lesson-title-${lesson.id}`}
                              value={lesson.title}
                              onChange={(e) => updateLesson(lesson.id, "title", e.target.value)}
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
                          <Label htmlFor={`lesson-content-${lesson.id}`}>Lesson Content</Label>
                          <div className="border rounded-md p-1">
                            <div className="flex items-center gap-1 mb-2 bg-muted/50 rounded p-1">
                              <Button variant="ghost" size="sm">
                                Bold
                              </Button>
                              <Button variant="ghost" size="sm">
                                Italic
                              </Button>
                              <Button variant="ghost" size="sm">
                                List
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Upload className="h-4 w-4 mr-1" />
                                Image
                              </Button>
                            </div>
                            <Textarea
                              id={`lesson-content-${lesson.id}`}
                              value={lesson.content}
                              onChange={(e) => updateLesson(lesson.id, "content", e.target.value)}
                              placeholder="Enter lesson content here..."
                              rows={8}
                              className="border-none focus-visible:ring-0 resize-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Quiz Questions</Label>
                            <Button variant="outline" size="sm" onClick={() => addQuizQuestion(lesson.id)}>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Question
                            </Button>
                          </div>

                          {lesson.quizQuestions.length > 0 ? (
                            <div className="space-y-6">
                              {lesson.quizQuestions.map((question, qIndex) => (
                                <div key={question.id} className="space-y-4 border rounded-md p-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Question {qIndex + 1}</h4>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => removeQuizQuestion(lesson.id, question.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Remove question</span>
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`question-${lesson.id}-${question.id}`}>Question</Label>
                                    <Input
                                      id={`question-${lesson.id}-${question.id}`}
                                      value={question.question}
                                      onChange={(e) =>
                                        updateQuizQuestion(lesson.id, question.id, "question", e.target.value)
                                      }
                                      placeholder="Enter question"
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    <Label>Answer Options</Label>
                                    {question.options.map((option, oIndex) => (
                                      <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          id={`option-${lesson.id}-${question.id}-${oIndex}`}
                                          name={`question-${lesson.id}-${question.id}`}
                                          checked={question.correctOption === oIndex}
                                          onChange={() =>
                                            updateQuizQuestion(lesson.id, question.id, "correctOption", oIndex)
                                          }
                                          className="h-4 w-4 text-primary"
                                        />
                                        <Input
                                          value={option}
                                          onChange={(e) =>
                                            updateQuizOption(lesson.id, question.id, oIndex, e.target.value)
                                          }
                                          placeholder={`Option ${oIndex + 1}`}
                                          className="flex-1"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">No quiz questions added yet</div>
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
                    <SubjectIcon subject={moduleSubject as any} className="h-8 w-8" />
                    <span className="capitalize">{moduleSubject}</span>
                  </div>
                ) : (
                  <div className="h-8 bg-muted rounded animate-pulse" />
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  {moduleDescription ? (
                    <p className="text-sm text-muted-foreground">{moduleDescription}</p>
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
                        <span className="text-sm">{lesson.title || `Lesson ${index + 1}`}</span>
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
                <Select defaultValue="draft">
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
                    <SelectItem value="individual">Individual Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
