import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleCard } from "@/components/module-card"
import { XpBadge } from "@/components/xp-badge"
import { ProgressBar } from "@/components/progress-bar"
import { BookOpen, Award, Clock, Trophy } from "lucide-react"

// Mock data for student dashboard
const inProgressModules = [
  {
    id: "1",
    title: "Algebra Fundamentals",
    subject: "math" as const,
    description: "Learn the basics of algebra including variables, equations, and functions.",
    lessonCount: 8,
    progress: 0.75,
    status: "in-progress" as const,
  },
  {
    id: "2",
    title: "Reading Comprehension",
    subject: "reading" as const,
    description: "Develop critical reading skills through analysis of various text types.",
    lessonCount: 6,
    progress: 0.33,
    status: "in-progress" as const,
  },
]

const recentlyCompletedModules = [
  {
    id: "3",
    title: "Scientific Method",
    subject: "science" as const,
    description: "Understand the process of scientific inquiry and experimentation.",
    lessonCount: 5,
    progress: 1.0,
    status: "completed" as const,
  },
]

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Sam! Continue your learning journey.</p>
        </div>
        <XpBadge xp={1250} level={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Modules currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Modules completed so far</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">+150 XP this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Continue Learning</h2>
          <Button variant="outline" asChild>
            <Link href="/student/modules">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgressModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              subject={module.subject}
              description={module.description}
              lessonCount={module.lessonCount}
              progress={module.progress}
              userType="student"
              status={module.status}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recently Completed</h2>
          <Button variant="outline" asChild>
            <Link href="/student/completed">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentlyCompletedModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              subject={module.subject}
              description={module.description}
              lessonCount={module.lessonCount}
              progress={module.progress}
              userType="student"
              status={module.status}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Math</p>
                </div>
                <div className="font-medium text-sm">75%</div>
              </div>
              <ProgressBar value={75} max={100} showLabel={false} color="math" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reading</p>
                </div>
                <div className="font-medium text-sm">60%</div>
              </div>
              <ProgressBar value={60} max={100} showLabel={false} color="reading" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Science</p>
                </div>
                <div className="font-medium text-sm">90%</div>
              </div>
              <ProgressBar value={90} max={100} showLabel={false} color="science" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Overall</p>
                </div>
                <div className="font-medium text-sm">75%</div>
              </div>
              <ProgressBar value={75} max={100} showLabel={false} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
