
import React, { useState } from 'react';

interface CreateTicketFormProps {
  onSubmit: (data: {
    text: string;
    customer_tier: string;
    sla_hours_remaining: number;
    customer_name?: string;
    customer_email?: string;
    customer_account_id?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [text, setText] = useState('');
  const [customerTier, setCustomerTier] = useState('business');
  const [slaHours, setSlaHours] = useState('24');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAccountId, setCustomerAccountId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (text.trim().length < 10) {
      newErrors.text = 'Ticket description must be at least 10 characters';
    }
    if (text.trim().length > 5000) {
      newErrors.text = 'Ticket description must be less than 5000 characters';
    }

    const hours = parseFloat(slaHours);
    if (isNaN(hours) || hours <= 0) {
      newErrors.sla = 'SLA hours must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      text: text.trim(),
      customer_tier: customerTier,
      sla_hours_remaining: parseFloat(slaHours),
      customer_name: customerName.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      customer_account_id: customerAccountId.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ticket Description */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
          Ticket Description *
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the issue or request..."
          className={`textarea min-h-[150px] ${
            errors.text ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={isSubmitting}
        />
        {errors.text && (
          <p className="mt-1 text-sm text-red-600">{errors.text}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {text.length} / 5000 characters
        </p>
      </div>

      {/* Customer Tier */}
      <div>
        <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Tier *
        </label>
        <select
          id="tier"
          value={customerTier}
          onChange={(e) => setCustomerTier(e.target.value)}
          className="select"
          disabled={isSubmitting}
        >
          <option value="enterprise">Tier-1 (Enterprise)</option>
          <option value="business">Tier-2 (Business)</option>
          <option value="standard">Tier-3 (Standard)</option>
          <option value="free">Tier-4 (Free)</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Higher tiers receive priority in the queue
        </p>
      </div>

      {/* SLA Hours */}
      <div>
        <label htmlFor="sla" className="block text-sm font-medium text-gray-700 mb-2">
          SLA Hours Remaining *
        </label>
        <input
          id="sla"
          type="number"
          step="0.5"
          min="0.5"
          value={slaHours}
          onChange={(e) => setSlaHours(e.target.value)}
          className={`input ${
            errors.sla ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={isSubmitting}
        />
        {errors.sla && (
          <p className="mt-1 text-sm text-red-600">{errors.sla}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Tickets with &lt; 4 hours are marked as high priority
        </p>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSlaHours('1')}
            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            disabled={isSubmitting}
          >
            Critical (1h)
          </button>
          <button
            type="button"
            onClick={() => setSlaHours('4')}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            disabled={isSubmitting}
          >
            Urgent (4h)
          </button>
          <button
            type="button"
            onClick={() => setSlaHours('24')}
            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
            disabled={isSubmitting}
          >
            Normal (24h)
          </button>
          <button
            type="button"
            onClick={() => setSlaHours('72')}
            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            disabled={isSubmitting}
          >
            Low (72h)
          </button>
        </div>
      </div>

      {/* Customer Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Customer Details (Optional)
        </h3>
        
        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Smith"
              className="input"
              disabled={isSubmitting}
            />
          </div>

          {/* Customer Email */}
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. john.smith@company.com"
              className="input"
              disabled={isSubmitting}
            />
          </div>

          {/* Account ID */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
              Account ID
            </label>
            <input
              id="accountId"
              type="text"
              value={customerAccountId}
              onChange={(e) => setCustomerAccountId(e.target.value)}
              placeholder="e.g. ACC-12345"
              className="input"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating & Analyzing...
            </span>
          ) : (
            '🎯 Create Ticket'
          )}
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Ticket is created in the system</li>
              <li>AI analyzes urgency and sentiment</li>
              <li>Priority score is calculated automatically</li>
              <li>Ticket appears in the queue, sorted by priority</li>
            </ol>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateTicketForm;