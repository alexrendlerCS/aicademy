import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SubjectIcon } from "@/components/subject-icon"
import { ProgressBar } from "@/components/progress-bar"
import { MoreHorizontal, Edit, Trash2, PlayCircle, CheckCircle, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface ModuleCardProps {
  id: string
  title: string
  subject: "math" | "reading" | "science" | "history" | "art" | "geography" | "music" | "coding" | "pe"
  description: string
  lessonCount: number
  progress?: number
  userType: "teacher" | "student"
  status?: "not-started" | "in-progress" | "completed"
}

export function ModuleCard({
  id,
  title,
  subject,
  description,
  lessonCount,
  progress = 0,
  userType,
  status = "not-started",
}: ModuleCardProps) {
  const isTeacher = userType === "teacher"
  const isCompleted = status === "completed"
  const isInProgress = status === "in-progress"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <SubjectIcon subject={subject} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>

          {isTeacher ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/teacher/modules/edit/${id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge
              variant={isCompleted ? "default" : "outline"}
              className={isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </>
              ) : isInProgress ? (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  In Progress
                </>
              ) : (
                "Not Started"
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center justify-between text-sm mb-2">
          <span>
            {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
          </span>
          {!isTeacher && <span className="text-muted-foreground">{Math.round(progress * 100)}% Complete</span>}
        </div>
        {!isTeacher && <ProgressBar value={progress * 100} max={100} showLabel={false} color={subject} />}
      </CardContent>
      <CardFooter className="pt-1">
        {isTeacher ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/teacher/modules/edit/${id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/teacher/modules/preview/${id}`}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/student/modules/${id}`}>
              {isCompleted ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Review
                </>
              ) : isInProgress ? (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Continue
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
