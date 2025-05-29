import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Demo user IDs
const DEMO_USER_IDS = [
  'a02fead5-0acd-4eec-a0dc-45306d5043c5', // demo teacher
  'd69a7de3-10f9-4718-9785-73114433fae9'  // demo student
];

export const isDemoUser = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return DEMO_USER_IDS.includes(userId);
};
