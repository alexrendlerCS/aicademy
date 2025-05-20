import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface XpBadgeProps {
  xp: number
  level: number
  showAnimation?: boolean
  className?: string
}

export function XpBadge({ xp, level, showAnimation = false, className }: XpBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          "bg-primary/10 text-primary border-primary/20 flex items-center gap-1 px-2 py-1",
          showAnimation && "xp-animation",
        )}
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>{xp} XP</span>
      </Badge>
      <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Level {level}</Badge>
    </div>
  )
}
