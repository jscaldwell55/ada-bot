/**
 * Tailwind CSS class name merge utility
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes intelligently
 * Handles conditional classes and prevents style conflicts
 *
 * @example
 * cn('px-2 py-1', 'px-4') // returns 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // conditional application
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
