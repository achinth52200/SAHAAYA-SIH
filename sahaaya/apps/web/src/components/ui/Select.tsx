'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        // No fixed height: `.input` already sets py-3, and pinning h-10 on top of that
        // clipped the option text inside the control.
        'input w-full',
        'data-[placeholder]:text-text-muted',
        className
      )}
      {...props}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      {children}
    </select>
  )
);
Select.displayName = 'Select';

const SelectTrigger = ({ children, ...props }: { children: React.ReactNode }) => (
  <div className={cn('input flex h-10 w-full items-center justify-between', 'data-[placeholder]:text-text-muted', '[&>span]:line-clamp-1')}>
    {children}
  </div>
);

const SelectValue = ({ children, ...props }: { children: React.ReactNode }) => (
  <span className="flex items-center">{children}</span>
);

const SelectContent = ({ children, ...props }: { children: React.ReactNode }) => (
  <div className="bg-surface border-border shadow-elevated rounded-xl overflow-hidden">{children}</div>
);

const SelectItem = ({ children, value, ...props }: { children: React.ReactNode; value: string }) => (
  <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-3 text-body-sm" role="option" {...props}>
    {children}
  </div>
);

const SelectGroup = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
);

const SelectLabel = ({ children, ...props }: { children: React.ReactNode }) => (
  <div className="px-3 py-1.5 text-body-sm font-semibold text-text-muted">{children}</div>
);

const SelectSeparator = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="border-border -mx-1 my-1" {...props} />
);

const SelectScrollUpButton = ({ children, ...props }: { children: React.ReactNode }) => (
  <button {...props}>{children}</button>
);

const SelectScrollDownButton = ({ children, ...props }: { children: React.ReactNode }) => (
  <button {...props}>{children}</button>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton };