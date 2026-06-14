import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-20 h-4 ml-auto" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <Skeleton className="w-40 h-5 mb-3" />
      <Skeleton className="w-24 h-4 mb-4" />
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-3/4 h-3" />
      </div>
    </div>
  );
}
