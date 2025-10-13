// src/lib/utils/helpers.ts

// A Tailwind-friendly class name combiner (like clsx + twMerge)
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
