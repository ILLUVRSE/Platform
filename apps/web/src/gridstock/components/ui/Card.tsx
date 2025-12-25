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
      className={`bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-sm ${onClick ? 'cursor-pointer hover:border-gray-700 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
