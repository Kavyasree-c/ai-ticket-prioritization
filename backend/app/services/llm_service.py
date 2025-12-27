
from openai import OpenAI
from typing import Optional
from datetime import datetime
import json
from app.models.ticket import LLMSignals, UrgencyLevel, SentimentType
from app.config import get_settings

settings = get_settings()


class LLMService:
    """Service for generating AI signals using OpenAI"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature
    
    def generate_signals(self, ticket_text: str, customer_tier: str, sla_hours: float) -> LLMSignals:
        """
        Generate AI signals for a ticket
        
        Returns LLMSignals with:
        - summary: 1 sentence factual summary
        - urgency: low, medium, high, critical
        - confidence: 0-1
        - sentiment: positive, neutral, negative
        - sentiment_intensity: 0-1
        """
        
        try:
            # Construct the prompt
            prompt = self._build_prompt(ticket_text, customer_tier, sla_hours)
            
            # Call OpenAI API with structured output
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert support ticket analyzer. You analyze tickets and provide structured signals in JSON format only. Be factual and concise."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            content = response.choices[0].message.content
            data = json.loads(content)
            
            # Validate and create LLMSignals
            signals = LLMSignals(
                summary=data.get("summary"),
                urgency=UrgencyLevel(data.get("urgency", "medium").lower()),
                confidence=float(data.get("confidence", 0.5)),
                sentiment=SentimentType(data.get("sentiment", "neutral").lower()),
                sentiment_intensity=float(data.get("sentiment_intensity", 0.5)),
                generated_at=datetime.utcnow(),
                error=None
            )
            
            return signals
            
        except Exception as e:
            # Return signals with error - system continues without AI
            return LLMSignals(
                summary=None,
                urgency=None,
                confidence=0.0,
                sentiment=None,
                sentiment_intensity=0.0,
                generated_at=datetime.utcnow(),
                error=str(e)
            )
    
    def _build_prompt(self, ticket_text: str, customer_tier: str, sla_hours: float) -> str:
        """Build the prompt for LLM"""
        return f"""Analyze this support ticket and return ONLY a JSON object with these exact fields:

Ticket Text: "{ticket_text}"
Customer Tier: {customer_tier}
SLA Hours Remaining: {sla_hours}

Return JSON with:
{{
  "summary": "One sentence factual summary of the issue (max 100 chars)",
  "urgency": "low|medium|high|critical (based on impact and time sensitivity)",
  "confidence": 0.0-1.0 (your confidence in the urgency assessment),
  "sentiment": "positive|neutral|negative (customer's emotional tone)",
  "sentiment_intensity": 0.0-1.0 (how strong the sentiment is)
}}

Guidelines:
- urgency "critical": system down, blocking work, data loss, security issue
- urgency "high": significant impact, multiple users affected, workarounds difficult
- urgency "medium": moderate impact, single user, workarounds available
- urgency "low": questions, feature requests, minor issues, compliments

- Higher confidence (0.8-1.0) when ticket is very clear
- Medium confidence (0.5-0.7) when some ambiguity exists
- Lower confidence (0.2-0.4) when ticket is vague or unclear

Return ONLY the JSON object, no other text."""
    
    async def generate_signals_async(self, ticket_text: str, customer_tier: str, sla_hours: float) -> LLMSignals:
        """Async version for non-blocking calls (future use)"""
        # For now, just call the sync version
        # In production, you'd use AsyncOpenAI
        return self.generate_signals(ticket_text, customer_tier, sla_hours)


# ALWAYS use mock for portfolio project (no API costs)
from app.services.llm_service_mock import mock_llm_service
llm_service = mock_llm_service