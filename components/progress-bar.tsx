import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  color?: "primary" | "secondary" | "math" | "reading" | "science" | "history" | "art"
}

export function ProgressBar({
  value,
  max,
  className,
  showLabel = true,
  size = "md",
  color = "primary",
}: ProgressBarProps) {
  const percent = Math.min(Math.max(0, (value / max) * 100), 100)

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    math: "bg-subject-math",
    reading: "bg-subject-reading",
    science: "bg-subject-science",
    history: "bg-subject-history",
    art: "bg-subject-art",
  }

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("rounded-full transition-all duration-300 ease-in-out", sizeClasses[size], colorClasses[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
