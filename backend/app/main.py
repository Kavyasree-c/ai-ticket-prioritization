from app.services.priority_service import priority_service
from app.services.ticket_store import ticket_store
from app.services.llm_service import llm_service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.routes import router

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered ticket prioritization system with human oversight"
)

app.include_router(router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "openai_configured": bool(settings.openai_api_key),
        "debug_mode": settings.debug_mode,
        "cors_origins": settings.cors_origins_list
    }
@app.get("/test/tickets")
async def test_tickets():
    """Test endpoint to see sample tickets"""
    tickets = ticket_store.get_all_tickets()
    return {
        "count": len(tickets),
        "tickets": [
            {
                "id": t.ticket_id,
                "text": t.text[:50] + "...",
                "tier": t.customer_tier.value,
                "sla": t.sla_hours_remaining
            }
            for t in tickets
        ]
    }
@app.post("/test/analyze")
async def test_analyze(ticket_text: str):
    """Test LLM signal generation"""
    signals = llm_service.generate_signals(
        ticket_text=ticket_text,
        customer_tier="enterprise",
        sla_hours=24.0
    )
    return {
        "ticket_text": ticket_text,
        "signals": signals.model_dump()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

# For development/demo, you can switch between real and mock
USE_MOCK = True  # Set to False when you have API quota

if USE_MOCK:
    from app.services.llm_service_mock import mock_llm_service
    llm_service = mock_llm_service
else:
    llm_service = LLMService()

@app.post("/test/full-analysis")
async def test_full_analysis(ticket_text: str, customer_tier: str = "enterprise", sla_hours: float = 24.0):
    """Test full pipeline: LLM → Priority Calculation"""
    
    # Generate LLM signals
    llm_signals = llm_service.generate_signals(ticket_text, customer_tier, sla_hours)
    
    # Create a test ticket
    from app.models.ticket import Ticket, CustomerTier
    ticket = Ticket(
        ticket_id="TEST-001",
        text=ticket_text,
        customer_tier=CustomerTier(customer_tier),
        sla_hours_remaining=sla_hours,
        llm_signals=llm_signals
    )
    
    # Calculate priority
    ticket = priority_service.calculate_priority(ticket)
    
    # Get explanation
    explanation = priority_service.get_priority_explanation(ticket)
    
    return {
        "ticket_id": ticket.ticket_id,
        "priority_score": ticket.priority_score,
        "priority_band": ticket.priority_band,
        "llm_signals": llm_signals.model_dump(),
        "breakdown": ticket.priority_breakdown.model_dump() if ticket.priority_breakdown else None,
        "explanation": explanation
    }
