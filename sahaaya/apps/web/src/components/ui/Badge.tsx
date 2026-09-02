'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variantClasses = {
      default: 'badge-gray',
      green: 'badge-green',
      yellow: 'badge-yellow',
      orange: 'badge-orange',
      red: 'badge-red',
      gray: 'badge-gray',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[0.625rem]',
      md: 'px-2.5 py-1 text-caption',
      lg: 'px-3 py-1.5 text-body-sm',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'green' && 'bg-distress-green',
              variant === 'yellow' && 'bg-distress-yellow',
              variant === 'orange' && 'bg-distress-orange',
              variant === 'red' && 'bg-distress-red',
              variant === 'gray' && 'bg-text-muted',
              variant === 'default' && 'bg-text-muted'
            )}
          />
        )}
        {children}
      </span>
    )
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    new: { variant: 'gray', label: 'New' },
    assigned: { variant: 'default', label: 'Assigned' },
    in_review: { variant: 'yellow', label: 'In Review' },
    intervention_decided: { variant: 'orange', label: 'Action Decided' },
    intervention_in_progress: { variant: 'default', label: 'In Progress' },
    resolved: { variant: 'green', label: 'Resolved' },
    escalated: { variant: 'red', label: 'Escalated' },
    false_positive: { variant: 'gray', label: 'Dismissed' },
    planned: { variant: 'gray', label: 'Planned' },
    in_progress: { variant: 'yellow', label: 'In Progress' },
    completed: { variant: 'green', label: 'Completed' },
    cancelled: { variant: 'gray', label: 'Cancelled' },
    overdue: { variant: 'red', label: 'Overdue' },
  };

  const config = statusConfig[status] || { variant: 'gray', label: status };

  return <Badge variant={config.variant} size={size} dot>{config.label}</Badge>;
};

export interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge = ({ priority, size = 'md' }: PriorityBadgeProps) => {
  const priorityConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'gray', label: 'Low' },
    medium: { variant: 'yellow', label: 'Medium' },
    high: { variant: 'orange', label: 'High' },
    critical: { variant: 'red', label: 'Critical' },
  };

  const config = priorityConfig[priority] || { variant: 'gray', label: priority };

  return <Badge variant={config.variant} size={size} dot>{config.label}</Badge>;
};

export interface DistressBandBadgeProps {
  band: 'Green' | 'Yellow' | 'Orange' | 'Red';
  size?: 'sm' | 'md' | 'lg';
  showScore?: number;
  className?: string;
}

export const DistressBandBadge = ({ band, size = 'md', showScore, className }: DistressBandBadgeProps) => {
  const bandConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    Green: { variant: 'green', label: 'Stable' },
    Yellow: { variant: 'yellow', label: 'Mild' },
    Orange: { variant: 'orange', label: 'Significant' },
    Red: { variant: 'red', label: 'Urgent' },
  };

  const config = bandConfig[band] || { variant: 'gray', label: band };

  return (
    <Badge variant={config.variant} size={size} className={`gap-1 ${className || ''}`}>
      {showScore !== undefined && (
        <span className="font-heading font-bold">{showScore}</span>
      )}
      {config.label}
    </Badge>
  );
};