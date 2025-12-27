
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

import Modal from './Modal';
import PriorityBreakdown from './PriorityBreakdown';
import PriorityBadge from './PriorityBadge';
import SentimentIndicator from './SentimentIndicator';
import UrgencyIndicator from './UrgencyIndicator';
import OverrideForm from './OverrideForm';

import { ticketApi } from '../services/api';

/* ===================== TYPES ===================== */

interface Ticket {
  ticket_id: string;
  text: string;
  customer_tier: string;
  customer_name?: string;
  customer_email?: string;
  customer_account_id?: string;
  sla_hours_remaining: number;
  created_at: string;
  priority_score: number;
  priority_band: string;
  priority_breakdown: any;
  llm_signals: any;
  manual_override: boolean;
  effective_priority: number;
  status: string;
  override_priority?: number;
  override_reason?: string;
  override_by?: string;
  override_at?: string;
}

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ===================== COMPONENT ===================== */

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  /* ---------- State ---------- */
  const [activeTab, setActiveTab] =
    useState<'overview' | 'priority' | 'history'>('overview');
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  /* ---------- Constants ---------- */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'priority', label: 'Priority Analysis', icon: '🎯' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  /* ---------- Handlers ---------- */

  const handleOverride = async (data: {
    priority: number;
    reason: string;
    by: string;
  }) => {
    try {
      setIsSubmitting(true);
      await ticketApi.overridePriority(ticket.ticket_id, {
        override_priority: data.priority,
        override_reason: data.reason,
        override_by: data.by,
      });
      setIsOverrideMode(false);
      alert('Priority override applied successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to apply override:', err);
      alert('Failed to apply override. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOverride = async () => {
    if (
      !confirm(
        'Remove manual override and revert to AI-calculated priority?'
      )
    )
      return;

    try {
      setIsSubmitting(true);
      await ticketApi.removeOverride(ticket.ticket_id);
      alert('Override removed successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to remove override:', err);
      alert('Failed to remove override. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Helpers ---------- */

  const getTierDisplay = (tier: string) => {
    const tierMap: Record<string, string> = {
      enterprise: 'TIER-1',
      business: 'TIER-2',
      standard: 'TIER-3',
      free: 'TIER-4',
    };
    return tierMap[tier] || tier.toUpperCase();
  };

  /* ===================== JSX ===================== */

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket ${ticket.ticket_id}`}>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <PriorityBadge
              priorityBand={ticket.priority_band}
              score={ticket.priority_score}
              size="lg"
            />

            <p className="bg-gray-50 p-4 rounded border">{ticket.text}</p>

            {(ticket.customer_name ||
              ticket.customer_email ||
              ticket.customer_account_id) && (
              <div className="bg-green-50 border p-4 rounded">
                <h3 className="font-semibold mb-3">👤 Customer Details</h3>

                {ticket.customer_name && (
                  <p>
                    <strong>Name:</strong> {ticket.customer_name}
                  </p>
                )}

                {ticket.customer_email && (
                  <p>
                    <strong>Email:</strong>{' '}
                    <a
                      href={`mailto:${ticket.customer_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {ticket.customer_email}
                    </a>
                  </p>
                )}

                {ticket.customer_account_id && (
                  <p>
                    <strong>Account ID:</strong>{' '}
                    <span className="font-mono">
                      {ticket.customer_account_id}
                    </span>
                  </p>
                )}
              </div>
            )}

            {ticket.llm_signals && !ticket.llm_signals.error && (
              <div className="bg-blue-50 border p-4 rounded">
                <UrgencyIndicator
                  urgency={ticket.llm_signals.urgency}
                  confidence={ticket.llm_signals.confidence}
                />
                <SentimentIndicator
                  sentiment={ticket.llm_signals.sentiment}
                  intensity={ticket.llm_signals.sentiment_intensity}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <p>Customer Tier</p>
                <strong>{getTierDisplay(ticket.customer_tier)}</strong>
              </div>
              <div className="card">
                <p>SLA Remaining</p>
                <strong>{ticket.sla_hours_remaining.toFixed(1)} hrs</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'priority' && ticket.priority_breakdown && (
          <PriorityBreakdown breakdown={ticket.priority_breakdown} />
        )}

        {activeTab === 'history' && (
          <p className="text-center text-gray-500 py-10">
            Ticket history coming soon
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t">
        {isOverrideMode ? (
          <OverrideForm
            currentPriority={ticket.priority_score}
            ticketId={ticket.ticket_id}
            onSubmit={handleOverride}
            onCancel={() => setIsOverrideMode(false)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            {ticket.manual_override ? (
              <button
                onClick={handleRemoveOverride}
                disabled={isSubmitting}
                className="btn-danger flex-1"
              >
                Remove Override
              </button>
            ) : (
              <button
                onClick={() => setIsOverrideMode(true)}
                className="btn-primary flex-1"
              >
                Override Priority
              </button>
            )}
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default TicketDetailModal;

