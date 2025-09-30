import {
  BookText,
  Calculator,
  Atom,
  Landmark,
  Palette,
  Globe,
  Music,
  Code,
  Dumbbell,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubjectType =
  | "math"
  | "reading"
  | "science"
  | "history"
  | "art"
  | "geography"
  | "music"
  | "coding"
  | "pe"
  | "writing";

interface SubjectIconProps {
  subject: string; // Now accepts any string (module title) instead of strict SubjectType
  className?: string;
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
    writing: PenTool,
  };

  // console.log('SubjectIcon received subject:', subject, 'Available keys:', Object.keys(iconMap));
  
  // Function to determine subject from module/class name or subject field
  const determineSubject = (subjectInput: string): keyof typeof iconMap => {
    if (!subjectInput) return 'reading'; // Default fallback
    
    const input = subjectInput.toLowerCase();
    
    // Check for exact matches first (for direct subject field values)
    if (iconMap[input as keyof typeof iconMap]) {
      return input as keyof typeof iconMap;
    }
    
    // Special handling for "Computer Science" -> "coding"
    if (input === 'computer science') return 'coding';
    
    // Check for partial matches in the name
    if (input.includes('math') || input.includes('algebra') || input.includes('calculus') || input.includes('geometry')) return 'math';
    if (input.includes('read') || input.includes('english') || input.includes('literature')) return 'reading';
    if (input.includes('science') || input.includes('chemistry') || input.includes('physics') || input.includes('biology')) return 'science';
    if (input.includes('history') || input.includes('social')) return 'history';
    if (input.includes('art') || input.includes('drawing') || input.includes('paint')) return 'art';
    if (input.includes('geography') || input.includes('geo')) return 'geography';
    if (input.includes('music') || input.includes('band') || input.includes('choir')) return 'music';
    if (input.includes('code') || input.includes('computer') || input.includes('programming') || input.includes('machine learning') || input.includes('ai')) return 'coding';
    if (input.includes('pe') || input.includes('physical') || input.includes('gym') || input.includes('sport')) return 'pe';
    if (input.includes('writing') || input.includes('essay') || input.includes('composition')) return 'writing';
    
    return 'reading'; // Final fallback
  };
  
  const actualSubject = determineSubject(subject);
  const Icon = iconMap[actualSubject];

  return (
    <div className={cn(`subject-icon subject-${actualSubject}`, className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
