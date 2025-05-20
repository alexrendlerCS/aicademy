import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModuleCard } from "@/components/module-card"
import { PlusCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for teacher modules
const modules = [
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
  {
    id: "4",
    title: "Ancient Civilizations",
    subject: "history" as const,
    description: "Explore the rise and fall of ancient civilizations and their contributions to modern society.",
    lessonCount: 7,
  },
  {
    id: "5",
    title: "Creative Expression",
    subject: "art" as const,
    description: "Discover various art forms and techniques for creative self-expression.",
    lessonCount: 4,
  },
  {
    id: "6",
    title: "World Geography",
    subject: "geography" as const,
    description: "Learn about countries, continents, and geographical features around the world.",
    lessonCount: 6,
  },
]

export default function TeacherModules() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Modules</h1>
          <p className="text-muted-foreground">Manage and organize your educational modules</p>
        </div>
        <Button asChild>
          <Link href="/teacher/modules/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Module
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search modules..." className="pl-8" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Subject" />
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
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
  )
}
