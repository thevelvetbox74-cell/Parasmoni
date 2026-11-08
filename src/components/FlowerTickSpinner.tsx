import React from 'react';

export interface FlowerTickSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Ultra-lightweight GPU-accelerated 12-tick flower radial spinner
 * Replicates Apple/iOS style flower tick spinner with zero network request overhead.
 */
export function FlowerTickSpinner({ 
  className = '', 
  size = 'md' 
}: FlowerTickSpinnerProps): React.JSX.Element {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9'
  }[size];

  return (
    <svg 
      className={`animate-spin text-stone-400/80 ${sizeClasses} ${className}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ animationDuration: '0.9s' }}
      aria-hidden="true"
    >
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line
          key={deg}
          x1="12"
          y1="3.2"
          x2="12"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
          opacity={(i + 1) / 12}
        />
      ))}
    </svg>
  );
}

export const WHITE_PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23faf8f5'/%3E%3C/svg%3E";
