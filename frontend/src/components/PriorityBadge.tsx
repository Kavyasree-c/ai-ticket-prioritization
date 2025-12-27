
import React from 'react';

interface PriorityBadgeProps {
  priorityBand: string;
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priorityBand, 
  score, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const getBadgeClass = () => {
    switch (priorityBand) {
      case 'P0':
        return 'badge-p0';
      case 'P1':
        return 'badge-p1';
      case 'P2':
        return 'badge-p2';
      case 'P3':
        return 'badge-p3';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Check if score is valid
  const displayScore = (typeof score === 'number' && !isNaN(score)) 
    ? (score * 100).toFixed(0) 
    : '0';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${getBadgeClass()} ${
        sizeClasses[size]
      }`}
    >
      <span>{priorityBand}</span>
      <span className="opacity-75">({displayScore}%)</span>
    </span>
  );
};

export default PriorityBadge;