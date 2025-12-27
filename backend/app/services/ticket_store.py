
from typing import List, Optional, Dict
from datetime import datetime
from app.models.ticket import Ticket, TicketCreate, CustomerTier
import uuid


class TicketStore:
    """In-memory ticket storage with basic CRUD operations"""
    
    def __init__(self):
        self.tickets: Dict[str, Ticket] = {}
        self._init_sample_data()
    
    def _init_sample_data(self):
        """Initialize with some sample tickets for demo purposes"""
        sample_tickets = [
            {
                "text": "Cannot access my account after password reset. Getting error 403 when trying to login. This is blocking my entire team from working.",
                "customer_tier": CustomerTier.ENTERPRISE,
                "sla_hours_remaining": 2.5,
                "customer_name" : "Sarah Johnson",
                "customer_email": "sarah.johnson@acmecorp.com",
                "customer_account_id": "ACC-ENT-10234"
            },
            {
                "text": "Would like to know if we can upgrade our plan to include the new analytics features announced last week.",
                "customer_tier": CustomerTier.BUSINESS,
                "sla_hours_remaining": 24.0,
                "customer_name": "Michael Chen",
                "customer_email": "mchen@techstartup.io",
                "customer_account_id": "ACC-BUS-50891"
            },
            {
                "text": "Dashboard loading is very slow, taking 10+ seconds. Started happening after yesterday's update.",
                "customer_tier": CustomerTier.ENTERPRISE,
                "sla_hours_remaining": 6.0,
                "customer_name": "Emily Rodriguez",
                "customer_email": "e.rodriguez@globalfinance.com",
                "customer_account_id": "ACC-ENT-10567"
            },
            {
                "text": "Quick question - how do I export data to CSV format? Checked docs but couldn't find it.",
                "customer_tier": CustomerTier.STANDARD,
                "sla_hours_remaining": 48.0,
                "customer_name": "David Park",
                "customer_email": "david.park@email.com",
                "customer_account_id": "ACC-STD-78234"
            },
            {
                "text": "URGENT: Production system is down! All customers are affected. Need immediate assistance!",
                "customer_tier": CustomerTier.ENTERPRISE,
                "sla_hours_remaining": 1.0,
                "customer_name": "Jessica Williams",
                "customer_email": "j.williams@enterprise-solutions.com",
                "customer_account_id": "ACC-ENT-10001"
            },
            {
                "text": "Love the new UI update! Just wanted to provide some positive feedback. The dark mode looks great.",
                "customer_tier": CustomerTier.BUSINESS,
                "sla_hours_remaining": 72.0,
                "customer_name": "Robert Taylor",
                "customer_email": "rtaylor@designstudio.co",
                "customer_account_id": "ACC-BUS-52341"
            }
        ]
        
        for sample in sample_tickets:
            ticket_create = TicketCreate(**sample)
            self.create_ticket(ticket_create)
    
    def create_ticket(self, ticket_data: TicketCreate) -> Ticket:
        """Create a new ticket"""
        ticket_id = f"TKT-{str(uuid.uuid4())[:8].upper()}"
        
        ticket = Ticket(
            ticket_id=ticket_id,
            text=ticket_data.text,
            customer_tier=ticket_data.customer_tier,
            customer_name=ticket_data.customer_name,  # ← Add this
            customer_email=ticket_data.customer_email,  # ← Add this
            customer_account_id=ticket_data.customer_account_id,
            sla_hours_remaining=ticket_data.sla_hours_remaining,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.tickets[ticket_id] = ticket
        return ticket
    
    def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        """Get a single ticket by ID"""
        return self.tickets.get(ticket_id)
    
    def get_all_tickets(self) -> List[Ticket]:
        """Get all tickets"""
        return list(self.tickets.values())
    
    def get_open_tickets(self) -> List[Ticket]:
        """Get only open tickets"""
        return [t for t in self.tickets.values() if t.status == "open"]
    
    def update_ticket(self, ticket_id: str, updates: dict) -> Optional[Ticket]:
        """Update a ticket with new data"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        # Update fields
        for key, value in updates.items():
            if value is not None and hasattr(ticket, key):
                setattr(ticket, key, value)
        
        ticket.updated_at = datetime.utcnow()
        return ticket
    
    def delete_ticket(self, ticket_id: str) -> bool:
        """Delete a ticket"""
        if ticket_id in self.tickets:
            del self.tickets[ticket_id]
            return True
        return False
    
    def get_sorted_queue(self) -> List[Ticket]:
        """Get open tickets sorted by effective priority (descending)"""
        open_tickets = self.get_open_tickets()
        return sorted(open_tickets, key=lambda t: t.effective_priority, reverse=True)
    
    def get_statistics(self) -> dict:
        """Get basic statistics about tickets"""
        tickets = list(self.tickets.values())
        open_tickets = [t for t in tickets if t.status == "open"]
        
        # Count by priority band
        priority_counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
        for ticket in open_tickets:
            priority_counts[ticket.priority_band] += 1
        
        # Count overrides
        override_count = sum(1 for t in tickets if t.manual_override)
        
        # Count by customer tier
        tier_counts = {}
        for ticket in open_tickets:
            tier = ticket.customer_tier.value
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        return {
            "total_tickets": len(tickets),
            "open_tickets": len(open_tickets),
            "in_progress": len([t for t in tickets if t.status == "in_progress"]),
            "resolved": len([t for t in tickets if t.status == "resolved"]),
            "priority_distribution": priority_counts,
            "override_count": override_count,
            "override_rate": override_count / len(tickets) if tickets else 0,
            "tier_distribution": tier_counts
        }
    
    def clear_all(self):
        """Clear all tickets (useful for testing)"""
        self.tickets = {}
    
    def reset_to_sample_data(self):
        """Reset store to initial sample data"""
        self.clear_all()
        self._init_sample_data()


# Global instance (singleton pattern for MVP)
ticket_store = TicketStore()