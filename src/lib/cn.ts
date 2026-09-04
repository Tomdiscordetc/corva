import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Kombiniert Klassenlisten und löst Tailwind-Konflikte auf. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
