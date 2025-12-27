// src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs uppercase tracking-wide text-[color:var(--grid-muted)]">
            {label}
          </label>
        )}
        <input 
          ref={ref}
          className={`gs-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--grid-accent)/0.35)] focus:border-transparent transition ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
