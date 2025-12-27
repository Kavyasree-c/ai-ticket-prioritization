
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.ticket import (
    Ticket,
    TicketCreate,
    TicketUpdate,
    ManualOverride,
    TicketFeedback,
    CustomerTier
)
from app.services.ticket_store import ticket_store
from app.services.llm_service import llm_service
from app.services.priority_service import priority_service

router = APIRouter(prefix="/api", tags=["tickets"])


# ============= TICKET CRUD =============

@router.post("/tickets", response_model=Ticket, status_code=201)
async def create_ticket(ticket_data: TicketCreate):
    """
    Create a new ticket
    
    Flow:
    1. Create ticket in store
    2. Generate LLM signals (async)
    3. Calculate priority score
    4. Return ticket
    """
    try:
        # Create ticket
        ticket = ticket_store.create_ticket(ticket_data)
        
        # Generate LLM signals
        llm_signals = llm_service.generate_signals(
            ticket_text=ticket.text,
            customer_tier=ticket.customer_tier.value,
            sla_hours=ticket.sla_hours_remaining
        )
        ticket.llm_signals = llm_signals
        
        # Calculate priority
        ticket = priority_service.calculate_priority(ticket)
        
        # Update in store
        ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return ticket
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")


@router.get("/tickets", response_model=List[Ticket])
async def get_all_tickets(
    status: Optional[str] = Query(None, description="Filter by status: open, in_progress, resolved"),
    sort_by_priority: bool = Query(True, description="Sort by priority score")
):
    """Get all tickets, optionally filtered and sorted"""
    try:
        if status == "open":
            tickets = ticket_store.get_open_tickets()
        else:
            tickets = ticket_store.get_all_tickets()
            if status:
                tickets = [t for t in tickets if t.status == status]
        
        if sort_by_priority:
            tickets = sorted(tickets, key=lambda t: t.effective_priority, reverse=True)
        
        return tickets
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tickets: {str(e)}")


@router.get("/tickets/queue", response_model=List[Ticket])
async def get_priority_queue():
    """
    Get prioritized ticket queue (open tickets sorted by priority)
    
    This is the main view for support agents
    """
    try:
        queue = ticket_store.get_sorted_queue()
        return queue
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch queue: {str(e)}")


@router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str):
    """Get a specific ticket by ID"""
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket


@router.patch("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, updates: TicketUpdate):
    """Update ticket fields (status, assignment, etc.)"""
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    # Update ticket
    update_dict = updates.model_dump(exclude_unset=True)
    updated_ticket = ticket_store.update_ticket(ticket_id, update_dict)
    
    return updated_ticket


@router.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: str):
    """Delete a ticket"""
    success = ticket_store.delete_ticket(ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return None


# ============= PRIORITY MANAGEMENT =============

@router.post("/tickets/{ticket_id}/reprioritize", response_model=Ticket)
async def reprioritize_ticket(ticket_id: str):
    """
    Manually trigger reprioritization of a ticket
    
    Useful when:
    - SLA has changed
    - Want fresh LLM analysis
    - Testing different scenarios
    """
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    # Don't reprioritize if manually overridden
    if ticket.manual_override:
        raise HTTPException(
            status_code=400,
            detail="Cannot reprioritize - ticket has manual override. Remove override first."
        )
    
    try:
        # Re-generate LLM signals
        llm_signals = llm_service.generate_signals(
            ticket_text=ticket.text,
            customer_tier=ticket.customer_tier.value,
            sla_hours=ticket.sla_hours_remaining
        )
        ticket.llm_signals = llm_signals
        
        # Recalculate priority
        ticket = priority_service.calculate_priority(ticket)
        
        # Update in store
        ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return ticket
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reprioritize: {str(e)}")


@router.post("/tickets/{ticket_id}/override", response_model=Ticket)
async def override_priority(ticket_id: str, override_data: ManualOverride):
    """
    Manually override ticket priority
    
    Agent can set priority and provide reason
    """
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    try:
        # Apply override
        ticket = priority_service.apply_manual_override(
            ticket=ticket,
            override_priority=override_data.override_priority,
            override_reason=override_data.override_reason,
            override_by=override_data.override_by
        )
        
        # Update in store
        ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return ticket
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply override: {str(e)}")


@router.delete("/tickets/{ticket_id}/override", response_model=Ticket)
async def remove_priority_override(ticket_id: str):
    """Remove manual priority override and revert to calculated priority"""
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    if not ticket.manual_override:
        raise HTTPException(status_code=400, detail="Ticket does not have a manual override")
    
    try:
        # Remove override
        ticket = priority_service.remove_override(ticket)
        
        # Recalculate priority
        ticket = priority_service.calculate_priority(ticket)
        
        # Update in store
        ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return ticket
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove override: {str(e)}")


@router.get("/tickets/{ticket_id}/explanation")
async def get_priority_explanation(ticket_id: str):
    """
    Get detailed explanation of how priority was calculated
    
    Perfect for UI transparency!
    """
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    explanation = priority_service.get_priority_explanation(ticket)
    return explanation


# ============= FEEDBACK =============

@router.post("/tickets/{ticket_id}/feedback", response_model=Ticket)
async def submit_feedback(ticket_id: str, feedback_data: TicketFeedback):
    """
    Submit agent feedback on priority accuracy
    
    Required before closing ticket (for learning)
    """
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    
    try:
        # Add feedback
        from datetime import datetime
        ticket.feedback = feedback_data.feedback
        ticket.feedback_by = feedback_data.feedback_by
        ticket.feedback_at = datetime.utcnow()
        
        # Update in store
        ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return ticket
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


# ============= ANALYTICS =============

@router.get("/analytics/statistics")
async def get_statistics():
    """
    Get system statistics
    
    Returns:
    - Ticket counts by status
    - Priority distribution
    - Override statistics
    - Customer tier distribution
    """
    try:
        stats = ticket_store.get_statistics()
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


@router.get("/analytics/ai-performance")
async def get_ai_performance():
    """
    Analyze AI performance metrics
    
    Compares AI predictions with human feedback
    """
    try:
        tickets = ticket_store.get_all_tickets()
        
        # Count tickets with feedback
        feedback_tickets = [t for t in tickets if t.feedback]
        
        if not feedback_tickets:
            return {
                "message": "No feedback data available yet",
                "total_tickets": len(tickets),
                "tickets_with_feedback": 0
            }
        
        # Count feedback types
        feedback_counts = {
            "too_high": len([t for t in feedback_tickets if t.feedback.value == "too_high"]),
            "correct": len([t for t in feedback_tickets if t.feedback.value == "correct"]),
            "too_low": len([t for t in feedback_tickets if t.feedback.value == "too_low"])
        }
        
        accuracy_rate = feedback_counts["correct"] / len(feedback_tickets) if feedback_tickets else 0
        
        return {
            "total_tickets": len(tickets),
            "tickets_with_feedback": len(feedback_tickets),
            "feedback_distribution": feedback_counts,
            "accuracy_rate": round(accuracy_rate, 2),
            "accuracy_percentage": f"{accuracy_rate * 100:.1f}%"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch AI performance: {str(e)}")


# ============= SYSTEM MANAGEMENT =============

@router.post("/system/reset", status_code=200)
async def reset_system():
    """
    Reset system to initial sample data
    
    Useful for demos and testing
    """
    try:
        ticket_store.reset_to_sample_data()
        
        # Prioritize all sample tickets
        tickets = ticket_store.get_all_tickets()
        for ticket in tickets:
            # Generate LLM signals
            llm_signals = llm_service.generate_signals(
                ticket_text=ticket.text,
                customer_tier=ticket.customer_tier.value,
                sla_hours=ticket.sla_hours_remaining
            )
            ticket.llm_signals = llm_signals
            
            # Calculate priority
            ticket = priority_service.calculate_priority(ticket)
            
            # Update in store
            ticket_store.update_ticket(ticket.ticket_id, ticket.model_dump())
        
        return {
            "message": "System reset to sample data",
            "ticket_count": len(tickets)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset system: {str(e)}")
    