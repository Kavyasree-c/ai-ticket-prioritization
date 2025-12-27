
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define types inline to avoid import issues
export interface Ticket {
  ticket_id: string;
  text: string;
  customer_tier: string;
  sla_hours_remaining: number;
  created_at: string;
  updated_at: string;
  llm_signals: any;
  priority_score: number;
  priority_breakdown: any;
  priority_band: string;
  manual_override: boolean;
  override_priority: number | null;
  override_reason: string | null;
  override_at: string | null;
  override_by: string | null;
  feedback: string | null;
  feedback_at: string | null;
  feedback_by: string | null;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
  effective_priority: number;
}

export interface TicketCreate {
  text: string;
  customer_tier: string;
  sla_hours_remaining: number;
}

export interface Statistics {
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

interface ManualOverride {
  override_priority: number;
  override_reason: string;
  override_by: string;
}

export const ticketApi = {
  getQueue: async (): Promise<Ticket[]> => {
    const response = await apiClient.get('/api/tickets/queue');
    return response.data;
  },

  getAllTickets: async (): Promise<Ticket[]> => {
    const response = await apiClient.get('/api/tickets');
    return response.data;
  },

  getTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  createTicket: async (ticketData: TicketCreate): Promise<Ticket> => {
    const response = await apiClient.post('/api/tickets', ticketData);
    return response.data;
  },

  overridePriority: async (
    ticketId: string,
    overrideData: ManualOverride
  ): Promise<Ticket> => {
    const response = await apiClient.post(
      `/api/tickets/${ticketId}/override`,
      overrideData
    );
    return response.data;
  },

  removeOverride: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.delete(`/api/tickets/${ticketId}/override`);
    return response.data;
  },

  getExplanation: async (ticketId: string): Promise<any> => {
    const response = await apiClient.get(`/api/tickets/${ticketId}/explanation`);
    return response.data;
  },

  getStatistics: async (): Promise<Statistics> => {
    const response = await apiClient.get('/api/analytics/statistics');
    return response.data;
  },

  resetSystem: async (): Promise<{ message: string; ticket_count: number }> => {
    const response = await apiClient.post('/api/system/reset');
    return response.data;
  },
};

export default apiClient;