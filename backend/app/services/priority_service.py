
from typing import Optional
from datetime import datetime
from app.models.ticket import (
    Ticket, 
    PriorityBreakdown, 
    UrgencyLevel,
    LLMSignals
)
from app.config import get_settings

settings = get_settings()


class PriorityService:
    """
    Deterministic priority scoring engine
    Combines AI signals with business rules
    """
    
    def __init__(self):
        # Weights from config
        self.weight_urgency = settings.weight_urgency
        self.weight_sla = settings.weight_sla
        self.weight_customer_tier = settings.weight_customer_tier
        
        # Urgency to score mapping
        self.urgency_scores = {
            UrgencyLevel.LOW: 0.2,
            UrgencyLevel.MEDIUM: 0.5,
            UrgencyLevel.HIGH: 0.8,
            UrgencyLevel.CRITICAL: 1.0,
        }
    
    def calculate_priority(self, ticket: Ticket) -> Ticket:
        """
        Calculate priority score for a ticket
        
        Formula:
        priority_score = 
            0.4 × effective_urgency +
            0.4 × sla_risk +
            0.2 × customer_tier_weight
        
        Returns updated ticket with priority_score and breakdown
        """
        
        # Calculate components
        effective_urgency = self._calculate_effective_urgency(ticket.llm_signals)
        sla_risk = self._calculate_sla_risk(ticket.sla_hours_remaining)
        customer_tier_weight = self._calculate_customer_tier_weight(ticket.customer_tier.value)
        
        # Calculate weighted contributions
        urgency_contribution = effective_urgency * self.weight_urgency
        sla_contribution = sla_risk * self.weight_sla
        tier_contribution = customer_tier_weight * self.weight_customer_tier
        
        # Final score
        final_score = urgency_contribution + sla_contribution + tier_contribution
        
        # Ensure score is between 0 and 1
        final_score = max(0.0, min(1.0, final_score))
        
        # Create priority breakdown for explainability
        breakdown = PriorityBreakdown(
            effective_urgency=effective_urgency,
            sla_risk=sla_risk,
            customer_tier_weight=customer_tier_weight,
            final_score=final_score,
            urgency_contribution=urgency_contribution,
            sla_contribution=sla_contribution,
            tier_contribution=tier_contribution,
            calculated_at=datetime.utcnow()
        )
        
        # Update ticket
        ticket.priority_score = final_score
        # Calculate priority band
        if final_score >= 0.8:
            priority_band = "P0"
        elif final_score >= 0.6:
            priority_band = "P1"
        elif final_score >= 0.4:
            priority_band = "P2"
        else:
            priority_band = "P3"

        # Store as regular field (not property)
        ticket.priority_band = priority_band



        
        ticket.priority_breakdown = breakdown
        ticket.updated_at = datetime.utcnow()
        
        return ticket
    
    def _calculate_effective_urgency(self, llm_signals: Optional[LLMSignals]) -> float:
        """
        Calculate effective urgency from LLM signals
        
        effective_urgency = urgency_score × confidence
        
        If LLM failed, returns 0.5 (medium) as safe default
        """
        if not llm_signals or llm_signals.error or not llm_signals.urgency:
            # LLM failed - use safe default (medium urgency)
            return 0.5
        
        urgency_score = self.urgency_scores.get(llm_signals.urgency, 0.5)
        confidence = llm_signals.confidence or 0.5
        
        # Multiply urgency by confidence
        effective = urgency_score * confidence
        
        return round(effective, 3)
    
    def _calculate_sla_risk(self, sla_hours_remaining: float) -> float:
        """
        Calculate SLA risk score
        
        < 4 hours remaining → 1.0 (high risk)
        >= 4 hours → 0.3 (low risk)
        
        This is deterministic and cannot be overridden by AI
        """
        if sla_hours_remaining < 4:
            return 1.0
        else:
            return 0.3
    
    def _calculate_customer_tier_weight(self, customer_tier: str) -> float:
        """
        Calculate customer tier weight
        
        enterprise → 1.0
        business → 0.6
        standard → 0.4
        free → 0.2
        """
        tier_weights = {
            "enterprise": 1.0,
            "business": 0.6,
            "standard": 0.4,
            "free": 0.2
        }
        
        return tier_weights.get(customer_tier.lower(), 0.2)
    
    def recalculate_queue(self, tickets: list[Ticket]) -> list[Ticket]:
        """
        Recalculate priority for all tickets and return sorted queue
        
        Tickets with manual overrides keep their override priority
        """
        updated_tickets = []
        
        for ticket in tickets:
            # Skip recalculation if manually overridden
            if not ticket.manual_override:
                ticket = self.calculate_priority(ticket)
            
            updated_tickets.append(ticket)
        
        # Sort by effective priority (considers overrides)
        sorted_tickets = sorted(
            updated_tickets,
            key=lambda t: t.effective_priority,
            reverse=True
        )
        
        return sorted_tickets
    
    def apply_manual_override(
        self,
        ticket: Ticket,
        override_priority: float,
        override_reason: str,
        override_by: str
    ) -> Ticket:
        """
        Apply manual priority override
        
        Preserves AI data for comparison
        """
        ticket.manual_override = True
        ticket.override_priority = override_priority
        ticket.override_reason = override_reason
        ticket.override_by = override_by
        ticket.override_at = datetime.utcnow()
        ticket.updated_at = datetime.utcnow()
        
        return ticket
    
    def remove_override(self, ticket: Ticket) -> Ticket:
        """Remove manual override and revert to calculated priority"""
        ticket.manual_override = False
        ticket.override_priority = None
        ticket.override_reason = None
        ticket.override_by = None
        ticket.override_at = None
        ticket.updated_at = datetime.utcnow()
        
        return ticket
    
    def get_priority_explanation(self, ticket: Ticket) -> dict:
        """
        Generate human-readable explanation of priority score
        Perfect for UI display!
        """
        if ticket.manual_override:
            return {
                "type": "manual_override",
                "priority": ticket.override_priority,
                "reason": ticket.override_reason,
                "overridden_by": ticket.override_by,
                "overridden_at": ticket.override_at,
                "original_score": ticket.priority_score,
                "message": f"Priority manually set to {ticket.override_priority:.2f} by {ticket.override_by}"
            }
        
        if not ticket.priority_breakdown:
            return {
                "type": "not_calculated",
                "message": "Priority not yet calculated"
            }
        
        breakdown = ticket.priority_breakdown
        
        # Build explanation
        explanation = {
            "type": "calculated",
            "final_score": breakdown.final_score,
            "priority_band": ticket.priority_band,
            "components": []
        }
        
        # Add urgency component
        if ticket.llm_signals and not ticket.llm_signals.error:
            explanation["components"].append({
                "name": "AI Urgency Analysis",
                "value": breakdown.effective_urgency,
                "weight": self.weight_urgency,
                "contribution": breakdown.urgency_contribution,
                "details": f"AI assessed as '{ticket.llm_signals.urgency.value}' with {ticket.llm_signals.confidence:.0%} confidence"
            })
        else:
            explanation["components"].append({
                "name": "AI Urgency Analysis",
                "value": breakdown.effective_urgency,
                "weight": self.weight_urgency,
                "contribution": breakdown.urgency_contribution,
                "details": "AI analysis unavailable - using default medium urgency"
            })
        
        # Add SLA component
        sla_status = "CRITICAL" if ticket.sla_hours_remaining < 4 else "OK"
        explanation["components"].append({
            "name": "SLA Risk",
            "value": breakdown.sla_risk,
            "weight": self.weight_sla,
            "contribution": breakdown.sla_contribution,
            "details": f"{ticket.sla_hours_remaining:.1f} hours remaining - {sla_status}"
        })
        
        # Add customer tier component
        explanation["components"].append({
            "name": "Customer Tier",
            "value": breakdown.customer_tier_weight,
            "weight": self.weight_customer_tier,
            "contribution": breakdown.tier_contribution,
            "details": f"{ticket.customer_tier.value.title()} tier customer"
        })
        
        # Add sentiment if available
        if ticket.llm_signals and ticket.llm_signals.sentiment:
            explanation["sentiment"] = {
                "type": ticket.llm_signals.sentiment.value,
                "intensity": ticket.llm_signals.sentiment_intensity,
                "note": "Sentiment tracked for quality metrics, not used in priority calculation"
            }
        
        return explanation


# Global instance
priority_service = PriorityService()