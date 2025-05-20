import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProgressBar } from "@/components/progress-bar"
import { SubjectIcon } from "@/components/subject-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Filter } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data for student progress
const students = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "alex.j@school.edu",
    level: 4,
    xp: 1250,
    progress: {
      math: 0.85,
      reading: 0.65,
      science: 0.92,
    },
  },
  {
    id: "2",
    name: "Jamie Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "jamie.s@school.edu",
    level: 3,
    xp: 980,
    progress: {
      math: 0.72,
      reading: 0.88,
      science: 0.76,
    },
  },
  {
    id: "3",
    name: "Taylor Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "taylor.w@school.edu",
    level: 5,
    xp: 1420,
    progress: {
      math: 0.95,
      reading: 0.78,
      science: 0.85,
    },
  },
  {
    id: "4",
    name: "Morgan Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "morgan.b@school.edu",
    level: 2,
    xp: 650,
    progress: {
      math: 0.45,
      reading: 0.62,
      science: 0.58,
    },
  },
  {
    id: "5",
    name: "Casey Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "casey.d@school.edu",
    level: 3,
    xp: 890,
    progress: {
      math: 0.68,
      reading: 0.75,
      science: 0.7,
    },
  },
]

// Mock data for modules
const modules = [
  {
    id: "1",
    title: "Algebra Fundamentals",
    subject: "math",
    completion: 0.8,
  },
  {
    id: "2",
    title: "Reading Comprehension",
    subject: "reading",
    completion: 0.65,
  },
  {
    id: "3",
    title: "Scientific Method",
    subject: "science",
    completion: 0.9,
  },
]

export default function StudentProgress() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground">Track and analyze student performance across modules</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search students..." className="pl-8" />
        </div>
        <Select defaultValue="all-classes">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-classes">All Classes</SelectItem>
            <SelectItem value="class-5a">Class 5A</SelectItem>
            <SelectItem value="class-5b">Class 5B</SelectItem>
            <SelectItem value="class-6a">Class 6A</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Math</TableHead>
                    <TableHead>Reading</TableHead>
                    <TableHead>Science</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const overallProgress =
                      (student.progress.math + student.progress.reading + student.progress.science) / 3

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={student.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {student.level}
                            </div>
                            <span className="text-sm text-muted-foreground">{student.xp} XP</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ProgressBar
                            value={student.progress.math * 100}
                            max={100}
                            showLabel={false}
                            size="sm"
                            color="math"
                          />
                        </TableCell>
                        <TableCell>
                          <ProgressBar
                            value={student.progress.reading * 100}
                            max={100}
                            showLabel={false}
                            size="sm"
                            color="reading"
                          />
                        </TableCell>
                        <TableCell>
                          <ProgressBar
                            value={student.progress.science * 100}
                            max={100}
                            showLabel={false}
                            size="sm"
                            color="science"
                          />
                        </TableCell>
                        <TableCell>
                          <ProgressBar value={overallProgress * 100} max={100} showLabel={false} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SubjectIcon subject={module.subject as any} />
                        <div>
                          <h4 className="font-medium">{module.title}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{module.subject}</p>
                        </div>
                      </div>
                      <div className="font-medium">{Math.round(module.completion * 100)}%</div>
                    </div>
                    <ProgressBar
                      value={module.completion * 100}
                      max={100}
                      showLabel={false}
                      color={module.subject as any}
                    />
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
