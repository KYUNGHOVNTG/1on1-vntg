/**
 * Utility function for merging class names
 * Combines multiple class names and filters out falsy values
 */

type ClassValue = string | number | boolean | undefined | null;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
