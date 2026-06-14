import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  red?: boolean;
  hover?: boolean;
}

export function Card({ children, className = '', red = false, hover = false }: CardProps) {
  const border = red ? 'border-red-800' : 'border-[var(--border)]';
  const hoverClass = hover ? 'judge-card cursor-pointer' : '';
  return (
    <div
      className={`bg-[var(--bg-card)] border ${border} rounded-xl ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
