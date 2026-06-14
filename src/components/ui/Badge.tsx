import React from 'react';

type BadgeVariant = 'red' | 'green' | 'orange' | 'muted' | 'blue';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  red: 'bg-red-950 text-red-400 border-red-900',
  green: 'bg-green-950 text-green-400 border-green-900',
  orange: 'bg-orange-950 text-orange-400 border-orange-900',
  blue: 'bg-blue-950 text-blue-400 border-blue-900',
  muted: 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]',
};

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
