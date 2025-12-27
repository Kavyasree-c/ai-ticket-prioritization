
import React, { useEffect, useState } from 'react';
import { ticketApi } from '../services/api';

interface Statistics {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
  priority_distribution: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
  override_count: number;
  override_rate: number;
  tier_distribution: Record<string, number>;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ticketApi.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load analytics data
      </div>
    );
  }

  const totalTickets = stats.total_tickets || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time insights into ticket prioritization and AI performance
          </p>
        </div>
        <button
          onClick={loadStats}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tickets */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total_tickets}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats.open_tickets}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔓</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.open_tickets / totalTickets) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {((stats.open_tickets / totalTickets) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.in_progress}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        </div>

        {/* Resolved */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.resolved}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.resolved / totalTickets) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {((stats.resolved / totalTickets) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Priority Distribution
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.priority_distribution).map(([priority, count]) => {
            const percentage = (count / stats.open_tickets) * 100 || 0;
            const colors: Record<string, { bg: string; text: string; bar: string }> = {
              P0: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' },
              P1: { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500' },
              P2: { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' },
              P3: { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' },
            };
            const color = colors[priority];

            return (
              <div key={priority}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color.bg} ${color.text}`}>
                      {priority}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count} tickets
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${color.bar}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* AI Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🤖</span>
            AI Performance
          </h3>
          <div className="space-y-4">
            {/* Override Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Manual Override Rate</span>
                <span className="text-lg font-bold text-purple-600">
                  {(stats.override_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.override_rate * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.override_count} out of {stats.total_tickets} tickets manually adjusted
              </p>
            </div>

            {/* AI Confidence */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                AI Autonomy Score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {((1 - stats.override_rate) * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-blue-700 mb-1">
                  of tickets use AI priority
                </span>
              </div>
            </div>

            {/* Insight */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-800">
                <span className="font-semibold">💡 Insight:</span>{' '}
                {stats.override_rate < 0.2
                  ? 'AI is performing well with minimal human intervention needed.'
                  : stats.override_rate < 0.4
                  ? 'Moderate override rate - consider reviewing AI thresholds.'
                  : 'High override rate - AI may need recalibration.'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Tier Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👥</span>
            Customer Tier Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.tier_distribution).map(([tier, count]) => {
              const percentage = (count / stats.open_tickets) * 100 || 0;
              const tierNames: Record<string, string> = {
                enterprise: 'TIER-1',
                business: 'TIER-2',
                standard: 'TIER-3',
                free: 'TIER-4',
              };
              const tierColors: Record<string, string> = {
                enterprise: 'bg-purple-500',
                business: 'bg-blue-500',
                standard: 'bg-gray-500',
                free: 'bg-slate-500',
              };

              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {tierNames[tier] || tier.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${tierColors[tier] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📊</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              System Health Score
            </h3>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold text-primary-600">
                {(((stats.open_tickets / totalTickets) * 50) + ((1 - stats.override_rate) * 50)).toFixed(0)}
              </span>
              <span className="text-lg text-gray-600 mb-1">/ 100</span>
            </div>
            <p className="text-sm text-gray-700">
              Based on queue efficiency ({((stats.open_tickets / totalTickets) * 100).toFixed(0)}% active) 
              and AI autonomy ({((1 - stats.override_rate) * 100).toFixed(0)}% automated)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;