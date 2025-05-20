import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleCard } from "@/components/module-card"
import { PlusCircle, Users, BookOpen, BarChart } from "lucide-react"

// Mock data for teacher dashboard
const recentModules = [
  {
    id: "1",
    title: "Algebra Fundamentals",
    subject: "math" as const,
    description: "Learn the basics of algebra including variables, equations, and functions.",
    lessonCount: 8,
  },
  {
    id: "2",
    title: "Reading Comprehension",
    subject: "reading" as const,
    description: "Develop critical reading skills through analysis of various text types.",
    lessonCount: 6,
  },
  {
    id: "3",
    title: "Scientific Method",
    subject: "science" as const,
    description: "Understand the process of scientific inquiry and experimentation.",
    lessonCount: 5,
  },
]

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Ms. Johnson! Manage your modules and track student progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/modules/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Module
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">+5% since last month</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Modules</h2>
          <Button variant="outline" asChild>
            <Link href="/teacher/modules">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentModules.map((module) => (
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
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Student Progress</h2>
          <Button variant="outline" asChild>
            <Link href="/teacher/progress">View Details</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Class Overview</CardTitle>
            <CardDescription>Recent student activity and module completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Algebra Fundamentals</p>
                  <div className="text-sm text-muted-foreground">24/30 students completed</div>
                </div>
                <div className="font-medium">80%</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "80%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reading Comprehension</p>
                  <div className="text-sm text-muted-foreground">18/30 students completed</div>
                </div>
                <div className="font-medium">60%</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "60%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Scientific Method</p>
                  <div className="text-sm text-muted-foreground">27/30 students completed</div>
                </div>
                <div className="font-medium">90%</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "90%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
