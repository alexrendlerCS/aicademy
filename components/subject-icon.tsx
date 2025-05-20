import { BookText, Calculator, Atom, Landmark, Palette, Globe, Music, Code, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

type SubjectType = "math" | "reading" | "science" | "history" | "art" | "geography" | "music" | "coding" | "pe"

interface SubjectIconProps {
  subject: SubjectType
  className?: string
}

export function SubjectIcon({ subject, className }: SubjectIconProps) {
  const iconMap = {
    math: Calculator,
    reading: BookText,
    science: Atom,
    history: Landmark,
    art: Palette,
    geography: Globe,
    music: Music,
    coding: Code,
    pe: Dumbbell,
  }

  const Icon = iconMap[subject]

  return (
    <div className={cn(`subject-icon subject-${subject}`, className)}>
      <Icon className="h-5 w-5" />
    </div>
  )
}
