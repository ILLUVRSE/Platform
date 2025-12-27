// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'neutral' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const variants = {
    success:
      "bg-[rgb(var(--grid-success)/0.14)] text-[rgb(var(--grid-success))] border-[rgb(var(--grid-success)/0.4)]",
    danger:
      "bg-[rgb(var(--grid-danger)/0.14)] text-[rgb(var(--grid-danger))] border-[rgb(var(--grid-danger)/0.4)]",
    warning:
      "bg-[rgb(var(--grid-warning)/0.14)] text-[rgb(var(--grid-warning))] border-[rgb(var(--grid-warning)/0.4)]",
    neutral:
      "bg-[rgba(148,163,184,0.14)] text-[color:var(--grid-muted)] border-[rgba(148,163,184,0.28)]"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
};
