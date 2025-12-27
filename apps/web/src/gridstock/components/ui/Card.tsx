// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`gs-panel rounded-2xl p-4 transition ${onClick ? 'cursor-pointer hover:border-[rgb(var(--grid-accent)/0.5)] hover:shadow-[0_20px_36px_-26px_rgba(56,189,248,0.4)]' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
