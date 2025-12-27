
import React from 'react';

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

interface UrgencyIndicatorProps {
  urgency: UrgencyLevel | null;
  confidence?: number | null;
}

const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({ 
  urgency, 
  confidence 
}) => {
  if (!urgency) {
    return (
      <span className="text-xs text-gray-500 italic">
        AI analysis unavailable
      </span>
    );
  }

  const getUrgencyDisplay = () => {
    switch (urgency) {
      case 'critical':
        return {
          text: 'Critical',
          color: 'text-red-700',
          bg: 'bg-red-100',
          icon: '🔴',
        };
      case 'high':
        return {
          text: 'High',
          color: 'text-orange-700',
          bg: 'bg-orange-100',
          icon: '🟠',
        };
      case 'medium':
        return {
          text: 'Medium',
          color: 'text-yellow-700',
          bg: 'bg-yellow-100',
          icon: '🟡',
        };
      case 'low':
        return {
          text: 'Low',
          color: 'text-green-700',
          bg: 'bg-green-100',
          icon: '🟢',
        };
      default:
        return null;
    }
  };

  const display = getUrgencyDisplay();
  if (!display) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${display.bg}`}>
        <span>{display.icon}</span>
        <span className={`text-xs font-semibold ${display.color}`}>
          {display.text}
        </span>
      </div>
      {confidence !== null && confidence !== undefined && (
        <span className="text-xs text-gray-500">
          ({Math.round(confidence * 100)}% confident)
        </span>
      )}
    </div>
  );
};

export default UrgencyIndicator;