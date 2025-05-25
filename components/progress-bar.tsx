import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?:
    | "primary"
    | "secondary"
    | "math"
    | "reading"
    | "science"
    | "history"
    | "art";
}

export function ProgressBar({
  value,
  max,
  className,
  showLabel = true,
  size = "md",
  color = "primary",
}: ProgressBarProps) {
  // Ensure value is between 0 and max, then convert to percentage
  const safeValue = Math.max(0, Math.min(value, max));
  const percent = (safeValue / max) * 100;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

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
          className={cn(
            "rounded-full transition-all duration-300 ease-in-out bg-emerald-500",
            sizeClasses[size]
          )}
          style={{
            width: `${Math.max(0, Math.min(percent, 100))}%`,
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>
    </div>
  );
}
