// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/60 disabled:cursor-not-allowed disabled:opacity-50";
  
  const variants = {
    primary:
      "bg-[rgb(var(--grid-accent))] text-slate-950 shadow-[0_12px_26px_-18px_rgba(52,211,153,0.8)] hover:bg-[rgb(var(--grid-accent)/0.9)] focus:ring-[rgb(var(--grid-accent)/0.6)]",
    secondary:
      "bg-[color:var(--grid-panel-strong)] text-slate-100 border border-[color:var(--grid-border-strong)] hover:border-[rgb(var(--grid-accent)/0.5)] hover:text-white focus:ring-[rgb(var(--grid-accent)/0.4)]",
    danger:
      "bg-[rgb(var(--grid-danger))] text-slate-950 shadow-[0_12px_26px_-18px_rgba(248,113,113,0.7)] hover:bg-[rgb(var(--grid-danger)/0.9)] focus:ring-[rgb(var(--grid-danger)/0.5)]",
    ghost:
      "bg-transparent text-[color:var(--grid-muted)] hover:text-white hover:bg-white/5 border border-transparent focus:ring-white/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
