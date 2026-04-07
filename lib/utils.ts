import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Color interpolation (shared by heatmap components) ──

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function interpolateRgb(from: RgbColor, to: RgbColor, t: number): RgbColor {
  const c = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(from.r + (to.r - from.r) * c),
    g: Math.round(from.g + (to.g - from.g) * c),
    b: Math.round(from.b + (to.b - from.b) * c),
  };
}

export function rgbString(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function rgbaString(color: RgbColor, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
