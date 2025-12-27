
import { useState, useEffect } from 'react';
import { ticketApi } from './services/api';
import TicketCard from './components/TicketCard';
import Modal from './components/Modal';
import CreateTicketForm from './components/CreateTicketForm';
import TicketDetailModal from './components/TicketDetailModal';
import Analytics from './components/Analytics';

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
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeView, setActiveView] = useState<'queue' | 'analytics'>('queue');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketApi.getQueue();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tickets. Make sure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (data: {
    text: string;
    customer_tier: string;
    sla_hours_remaining: number;
    customer_name?: string;
    customer_email?: string;
    customer_account_id?: string;
  }) => {
    try {
      setIsSubmitting(true);
      await ticketApi.createTicket(data);
      setIsCreateModalOpen(false);
      await loadTickets();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    await loadTickets();
  };

  const handleReset = async () => {
    if (!confirm('Reset system to sample data? This will replace all current tickets.')) return;
    
    try {
      setLoading(true);
      await ticketApi.resetSystem();
      await loadTickets();
      alert('System reset successfully! Sample tickets loaded and analyzed.');
    } catch (err) {
      console.error('Failed to reset system:', err);
      alert('Failed to reset system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md text-center w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadTickets} className="btn-primary w-full sm:w-auto">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Top Bar - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                🎯 AI Ticket System
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {tickets.length} tickets
              </p>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2"
                title="Refresh queue"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden lg:inline">Refresh</span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
                title="Reset to sample data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9h16M4 15h16" />
                </svg>
                <span className="hidden lg:inline">Reset</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden lg:inline">Create</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mb-4 p-4 bg-white rounded-lg border border-gray-200 space-y-2">
              <button
                onClick={() => {
                  handleRefresh();
                  setIsMobileMenuOpen(false);
                }}
                className="btn-secondary w-full justify-center"
              >
                🔄 Refresh Queue
              </button>
              <button
                onClick={() => {
                  handleReset();
                  setIsMobileMenuOpen(false);
                }}
                className="btn-secondary w-full justify-center"
              >
                🔁 Reset System
              </button>
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="btn-primary w-full justify-center"
              >
                ➕ Create Ticket
              </button>
            </div>
          )}
          
          {/* Info Banner - Responsive */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mb-4">
            <span className="text-blue-600 text-lg sm:text-xl flex-shrink-0">ℹ️</span>
            <p className="text-xs sm:text-sm text-blue-900">
              <span className="font-medium">Demo Mode:</span> Mock AI (no costs)
            </p>
          </div>

          {/* Navigation Tabs - Responsive */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('queue')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeView === 'queue'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Queue
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeView === 'analytics'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Conditional Content */}
        {activeView === 'queue' ? (
          <>
            {/* Stats Bar - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {['P0', 'P1', 'P2', 'P3'].map((band) => {
                const count = tickets.filter((t) => t.priority_band === band).length;
                const bgClass =
                  band === 'P0' ? 'badge-p0' :
                  band === 'P1' ? 'badge-p1' :
                  band === 'P2' ? 'badge-p2' : 'badge-p3';
                return (
                  <div key={band} className="card text-center">
                    <div className={`text-xl sm:text-2xl font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded inline-block ${bgClass}`}>
                      {count}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-2">{band}</div>
                  </div>
                );
              })}
            </div>

            {/* Ticket List */}
            <div className="space-y-3 sm:space-y-4">
              {tickets.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500 mb-4">No tickets in queue</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary"
                  >
                    Create Your First Ticket
                  </button>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.ticket_id}
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <Analytics />
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Create New Ticket"
      >
        <CreateTicketForm
          onSubmit={handleCreateTicket}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-40"
        aria-label="Create ticket"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

export default App;