
import React from 'react';
// Use inline type definition
interface Ticket {
  ticket_id: string;
  text: string;
  customer_tier: string;
  sla_hours_remaining: number;
  created_at: string;
  priority_score: number;
  priority_band: string;
  priority_breakdown: any;
  llm_signals: any;
  manual_override: boolean;
  effective_priority: number;  // ← Add this line!
}
import PriorityBadge from './PriorityBadge';
import SentimentIndicator from './SentimentIndicator';
import UrgencyIndicator from './UrgencyIndicator';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const getCustomerTierBadge = () => {
     const tierMapping: Record<string, { label: string; color: string }> = {
      enterprise: { label: 'TIER-1', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      business: { label: 'TIER-2', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      standard: { label: 'TIER-3', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      free: { label: 'TIER-4', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  };
  const tier = tierMapping[ticket.customer_tier] || tierMapping.standard;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${tier.color}`}>
      {tier.label}
    </span>
    );
  };

  const getSLAWarning = () => {
    if (ticket.sla_hours_remaining < 4) {
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-semibold">
            SLA: {ticket.sla_hours_remaining.toFixed(1)}h remaining
          </span>
        </div>
      );
    }

    return (
      <span className="text-xs text-gray-500">
        SLA: {ticket.sla_hours_remaining.toFixed(1)}h
      </span>
    );
  };

  return (
    <div
      className={`card hover:shadow-md transition-all cursor-pointer border-l-4 touch-target active:scale-[0.98] ${
        ticket.manual_override ? 'border-l-purple-500' : 'border-l-transparent'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex items-center gap-3">
          <PriorityBadge
            priorityBand={ticket.priority_band}
            score={ticket.priority_score || 0}
          />
          {ticket.manual_override && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded border border-purple-200">
              MANUAL OVERRIDE
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{ticket.ticket_id}</span>
      </div>

      {/* Ticket Text */}
      <p className="text-gray-900 mb-3 line-clamp-2">{ticket.text}</p>

      {/* AI Signals */}
      {ticket.llm_signals && !ticket.llm_signals.error && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-900">
              🤖 AI Analysis
            </span>
          </div>
          {ticket.llm_signals.summary && (
            <p className="text-sm text-gray-700 mb-2 italic">
              "{ticket.llm_signals.summary}"
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <UrgencyIndicator
              urgency={ticket.llm_signals.urgency}
              confidence={ticket.llm_signals.confidence}
            />
            <SentimentIndicator
              sentiment={ticket.llm_signals.sentiment}
              intensity={ticket.llm_signals.sentiment_intensity}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {getCustomerTierBadge()}
          {getSLAWarning()}
        </div>
        <span className="text-gray-500">
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export default TicketCard;