import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge doesn't know about our custom fontSize scale (text-display-xl,
// text-heading-lg, text-body-sm, etc. from tailwind.config.js) out of the box, so
// it misreads them as text-color utilities and silently drops them whenever they
// appear alongside an actual text-color class (e.g. `text-heading-lg text-text-primary`)
// — this was collapsing every CardTitle/heading down to the raw h1-h6 base size.
// Registering the scale here fixes it project-wide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl', 'display-lg', 'display-md', 'display-sm',
            'heading-xl', 'heading-lg', 'heading-md', 'heading-sm',
            'body-lg', 'body', 'body-sm', 'caption',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getDistressBandColor(band: string): string {
  const colors: Record<string, string> = {
    Green: 'distress-green',
    Yellow: 'distress-yellow',
    Orange: 'distress-orange',
    Red: 'distress-red',
  };
  return colors[band] || 'distress-gray';
}

export function getDistressBandBg(band: string): string {
  const colors: Record<string, string> = {
    Green: 'bg-distress-green/10',
    Yellow: 'bg-distress-yellow/10',
    Orange: 'bg-distress-orange/10',
    Red: 'bg-distress-red/10',
  };
  return colors[band] || 'bg-secondary-100';
}

export function getDistressBandBorder(band: string): string {
  const colors: Record<string, string> = {
    Green: 'border-distress-green',
    Yellow: 'border-distress-yellow',
    Orange: 'border-distress-orange',
    Red: 'border-distress-red',
  };
  return colors[band] || 'border-border';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-text-secondary bg-secondary-100',
    medium: 'text-distress-yellow bg-distress-yellow/10',
    high: 'text-distress-orange bg-distress-orange/10',
    critical: 'text-distress-red bg-distress-red/10',
  };
  return colors[priority] || colors.low;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'text-text-secondary bg-secondary-100',
    assigned: 'text-primary-600 bg-primary-50',
    in_review: 'text-distress-yellow bg-distress-yellow/10',
    intervention_decided: 'text-distress-orange bg-distress-orange/10',
    intervention_in_progress: 'text-primary-600 bg-primary-50',
    resolved: 'text-distress-green bg-distress-green/10',
    escalated: 'text-distress-red bg-distress-red/10',
    false_positive: 'text-text-muted bg-secondary-100',
  };
  return colors[status] || colors.new;
}

export function getInterventionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    counselling: 'Counselling',
    legal_aid: 'Legal Aid',
    protection_support: 'Protection Support',
    financial_assistance: 'Financial Assistance',
    rehabilitation_referral: 'Rehab Referral',
    safety_planning: 'Safety Planning',
    crisis_hotline: 'Crisis Hotline',
    medical_referral: 'Medical Referral',
  };
  return labels[type] || type;
}

export function getInterventionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'text-text-secondary bg-secondary-100',
    assigned: 'text-primary-600 bg-primary-50',
    in_progress: 'text-distress-yellow bg-distress-yellow/10',
    completed: 'text-distress-green bg-distress-green/10',
    cancelled: 'text-text-muted bg-secondary-100',
    overdue: 'text-distress-red bg-distress-red/10',
  };
  return colors[status] || colors.planned;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}