
import React, { useState } from 'react';

interface OverrideFormProps {
  currentPriority: number;
  ticketId: string;
  onSubmit: (data: { priority: number; reason: string; by: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const OverrideForm: React.FC<OverrideFormProps> = ({
  currentPriority,
  //ticketId,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [priority, setPriority] = useState((currentPriority * 100).toFixed(0));
  const [reason, setReason] = useState('');
  const [agentName, setAgentName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const priorityNum = parseFloat(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 100) {
      newErrors.priority = 'Priority must be between 0 and 100';
    }

    if (reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters';
    }

    if (agentName.trim().length < 2) {
      newErrors.agentName = 'Please enter your name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      priority: parseFloat(priority) / 100,
      reason: reason.trim(),
      by: agentName.trim(),
    });
  };

  const priorityNum = parseFloat(priority) || 0;
  const getPriorityBand = () => {
    if (priorityNum >= 80) return { band: 'P0', color: 'text-red-600' };
    if (priorityNum >= 60) return { band: 'P1', color: 'text-orange-600' };
    if (priorityNum >= 40) return { band: 'P2', color: 'text-yellow-600' };
    return { band: 'P3', color: 'text-green-600' };
  };

  const priorityInfo = getPriorityBand();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-2">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div className="text-sm text-yellow-900">
            <p className="font-medium mb-1">Manual Override</p>
            <p className="text-yellow-800">
              You are about to override the AI-calculated priority. This will take precedence 
              over automatic scoring until the override is removed.
            </p>
          </div>
        </div>
      </div>

      {/* Current vs New Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Current Priority</p>
          <p className="text-2xl font-bold text-gray-900">
            {(currentPriority * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
          <p className="text-xs text-primary-700 mb-2">New Priority</p>
          <p className={`text-2xl font-bold ${priorityInfo.color}`}>
            {priorityNum.toFixed(0)}% ({priorityInfo.band})
          </p>
        </div>
      </div>

      {/* Priority Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Priority Score (0-100%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          disabled={isSubmitting}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low (0%)</span>
          <span>Medium (50%)</span>
          <span>High (100%)</span>
        </div>
        {errors.priority && (
          <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
        )}
      </div>

      {/* Numeric Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter exact value:
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input"
          disabled={isSubmitting}
        />
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Override *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you're overriding the AI priority..."
          className={`textarea min-h-[100px] ${
            errors.reason ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={isSubmitting}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
        )}
      </div>

      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="e.g. John Doe"
          className={`input ${
            errors.agentName ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={isSubmitting}
        />
        {errors.agentName && (
          <p className="mt-1 text-sm text-red-600">{errors.agentName}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Applying Override...' : '✓ Apply Override'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default OverrideForm;