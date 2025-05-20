"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressBar } from "@/components/progress-bar"
import { XpBadge } from "@/components/xp-badge"
import { SubjectIcon } from "@/components/subject-icon"
import { ArrowLeft, ArrowRight, CheckCircle, Home } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Mock data for a specific module
const moduleData = {
  id: "1",
  title: "Algebra Fundamentals",
  subject: "math" as const,
  description: "Learn the basics of algebra including variables, equations, and functions.",
  lessons: [
    {
      id: "1",
      title: "Introduction to Variables",
      content: `
        <h2>Introduction to Variables</h2>
        <p>In algebra, a variable is a symbol (usually a letter) that represents an unknown number.</p>
        <p>For example, in the equation x + 5 = 12, the variable x represents the unknown number that, when added to 5, equals 12.</p>
        <h3>Why Use Variables?</h3>
        <p>Variables allow us to:</p>
        <ul>
          <li>Write general mathematical statements</li>
          <li>Solve problems with unknown values</li>
          <li>Describe relationships between quantities</li>
        </ul>
        <p>In this module, you'll learn how to work with variables, solve equations, and understand algebraic expressions.</p>
      `,
      completed: true,
    },
    {
      id: "2",
      title: "Algebraic Expressions",
      content: `
        <h2>Algebraic Expressions</h2>
        <p>An algebraic expression is a combination of variables, numbers, and operations.</p>
        <p>Examples of algebraic expressions:</p>
        <ul>
          <li>3x + 2</li>
          <li>y² - 5y + 6</li>
          <li>2(a + b)</li>
        </ul>
        <h3>Terms and Coefficients</h3>
        <p>A term is a part of an expression separated by + or - signs.</p>
        <p>The coefficient is the number multiplied by the variable in a term.</p>
        <p>For example, in the expression 3x + 2:</p>
        <ul>
          <li>3x is a term, and 3 is the coefficient of x</li>
          <li>2 is a constant term</li>
        </ul>
      `,
      completed: true,
    },
    {
      id: "3",
      title: "Solving Simple Equations",
      content: `
        <h2>Solving Simple Equations</h2>
        <p>An equation is a mathematical statement that two expressions are equal.</p>
        <p>To solve an equation means to find the value of the variable that makes the equation true.</p>
        <h3>Steps to Solve Simple Equations:</h3>
        <ol>
          <li>Simplify each side of the equation</li>
          <li>Get all variable terms on one side</li>
          <li>Get all constant terms on the other side</li>
          <li>Divide both sides by the coefficient of the variable</li>
        </ol>
        <h3>Example:</h3>
        <p>Solve for x: 2x + 5 = 13</p>
        <p>Step 1: The equation is already simplified</p>
        <p>Step 2: Subtract 5 from both sides: 2x = 8</p>
        <p>Step 3: Divide both sides by 2: x = 4</p>
        <p>Therefore, x = 4 is the solution.</p>
      `,
      completed: false,
    },
    {
      id: "4",
      title: "Word Problems",
      content: `
        <h2>Word Problems</h2>
        <p>Algebra is powerful because it allows us to solve real-world problems.</p>
        <p>The key to solving word problems is translating the problem into an equation.</p>
        <h3>Steps for Solving Word Problems:</h3>
        <ol>
          <li>Read the problem carefully</li>
          <li>Identify the unknown quantity and assign a variable</li>
          <li>Write an equation that represents the situation</li>
          <li>Solve the equation</li>
          <li>Check your answer in the context of the original problem</li>
        </ol>
        <h3>Example:</h3>
        <p>A number plus 7 equals 15. What is the number?</p>
        <p>Let x = the unknown number</p>
        <p>Equation: x + 7 = 15</p>
        <p>Solving: x = 8</p>
        <p>Check: 8 + 7 = 15 ✓</p>
      `,
      completed: false,
    },
  ],
}

export default function ModuleView({ params }: { params: { id: string } }) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>(
    moduleData.lessons.filter((lesson) => lesson.completed).map((lesson) => lesson.id),
  )
  const [showXpAnimation, setShowXpAnimation] = useState(false)

  const currentLesson = moduleData.lessons[currentLessonIndex]
  const isFirstLesson = currentLessonIndex === 0
  const isLastLesson = currentLessonIndex === moduleData.lessons.length - 1
  const isLessonCompleted = completedLessons.includes(currentLesson.id)

  const progress = completedLessons.length / moduleData.lessons.length

  const handlePreviousLesson = () => {
    if (!isFirstLesson) {
      setCurrentLessonIndex(currentLessonIndex - 1)
    }
  }

  const handleNextLesson = () => {
    if (!isLastLesson) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    }
  }

  const handleCompleteLesson = () => {
    if (!isLessonCompleted) {
      setCompletedLessons([...completedLessons, currentLesson.id])
      setShowXpAnimation(true)

      setTimeout(() => {
        setShowXpAnimation(false)
      }, 2000)

      if (!isLastLesson) {
        setTimeout(() => {
          setCurrentLessonIndex(currentLessonIndex + 1)
        }, 1000)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/student/modules">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <SubjectIcon subject={moduleData.subject} className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">{moduleData.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/student" className="flex items-center hover:underline">
                <Home className="mr-1 h-3 w-3" />
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/student/modules" className="hover:underline">
                Modules
              </Link>
              <span>/</span>
              <span className="truncate">{moduleData.title}</span>
            </div>
          </div>
        </div>
        <XpBadge xp={1250} level={4} showAnimation={showXpAnimation} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Lesson {currentLessonIndex + 1} of {moduleData.lessons.length}
        </div>
        <ProgressBar value={progress * 100} max={100} className="w-full max-w-xs" color={moduleData.subject} />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-4">
            <div className="font-medium mb-2">Lessons</div>
            <ul className="space-y-1">
              {moduleData.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id)
                const isCurrent = index === currentLessonIndex

                return (
                  <li key={lesson.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "text-muted-foreground hover:bg-muted"
                            : "hover:bg-muted"
                      }`}
                      onClick={() => setCurrentLessonIndex(index)}
                    >
                      <div
                        className={`flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                          isCurrent
                            ? "bg-primary-foreground text-primary"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
                      </div>
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="lesson">
                <TabsList className="mb-4">
                  <TabsTrigger value="lesson">Lesson</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                </TabsList>

                <TabsContent value="lesson">
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                </TabsContent>

                <TabsContent value="quiz">
                  <div className="space-y-6">
                    <div className="text-lg font-medium">Quiz: {currentLesson.title}</div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="font-medium">Question 1</div>
                        <p>What is a variable in algebra?</p>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q1-a" name="q1" className="h-4 w-4" />
                            <label htmlFor="q1-a">A specific number used in equations</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q1-b" name="q1" className="h-4 w-4" />
                            <label htmlFor="q1-b">A symbol that represents an unknown value</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q1-c" name="q1" className="h-4 w-4" />
                            <label htmlFor="q1-c">An operation like addition or subtraction</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q1-d" name="q1" className="h-4 w-4" />
                            <label htmlFor="q1-d">A mathematical formula</label>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="font-medium">Question 2</div>
                        <p>In the expression 5x + 3, what is the coefficient of x?</p>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q2-a" name="q2" className="h-4 w-4" />
                            <label htmlFor="q2-a">3</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q2-b" name="q2" className="h-4 w-4" />
                            <label htmlFor="q2-b">5</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q2-c" name="q2" className="h-4 w-4" />
                            <label htmlFor="q2-c">x</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q2-d" name="q2" className="h-4 w-4" />
                            <label htmlFor="q2-d">5x</label>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="font-medium">Question 3</div>
                        <p>Solve for x: 2x + 6 = 14</p>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q3-a" name="q3" className="h-4 w-4" />
                            <label htmlFor="q3-a">x = 4</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q3-b" name="q3" className="h-4 w-4" />
                            <label htmlFor="q3-b">x = 5</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q3-c" name="q3" className="h-4 w-4" />
                            <label htmlFor="q3-c">x = 6</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="q3-d" name="q3" className="h-4 w-4" />
                            <label htmlFor="q3-d">x = 7</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>Submit Answers</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousLesson} disabled={isFirstLesson}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Lesson
            </Button>

            {isLessonCompleted ? (
              <Button onClick={handleNextLesson} disabled={isLastLesson}>
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCompleteLesson}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Lesson
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
