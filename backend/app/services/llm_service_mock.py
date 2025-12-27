
from typing import Optional
from datetime import datetime
import random
from app.models.ticket import LLMSignals, UrgencyLevel, SentimentType


class MockLLMService:
    """Mock LLM service for development and demo without API costs"""
    
    def __init__(self):
        self.model = "mock-gpt-4o-mini"
    
    def generate_signals(self, ticket_text: str, customer_tier: str, sla_hours: float) -> LLMSignals:
        """
        Generate mock AI signals based on keyword analysis
        This simulates what an LLM would return
        """
        
        text_lower = ticket_text.lower()
        
        # Determine urgency based on keywords
        urgency = self._determine_urgency(text_lower, sla_hours)
        
        # Determine sentiment based on keywords
        sentiment, sentiment_intensity = self._determine_sentiment(text_lower)
        
        # Generate summary (first 100 chars + keywords)
        summary = self._generate_summary(ticket_text)
        
        # Calculate confidence (higher for clear indicators)
        confidence = self._calculate_confidence(text_lower, urgency)
        
        return LLMSignals(
            summary=summary,
            urgency=urgency,
            confidence=confidence,
            sentiment=sentiment,
            sentiment_intensity=sentiment_intensity,
            generated_at=datetime.utcnow(),
            error=None
        )
    
    def _determine_urgency(self, text: str, sla_hours: float) -> UrgencyLevel:
        """Determine urgency based on keywords and SLA"""
        
        # Critical indicators
        critical_keywords = ['down', 'outage', 'cannot access', 'blocking', 'production', 
                            'emergency', 'urgent', 'critical', 'all users', 'system down',
                            'data loss', 'security breach']
        
        # High indicators
        high_keywords = ['slow', 'error', 'broken', 'not working', 'bug', 'issue',
                        'affecting multiple', 'team blocked']
        
        # Low indicators
        low_keywords = ['question', 'how to', 'feature request', 'love', 'great',
                       'thank you', 'feedback', 'suggestion']
        
        if any(keyword in text for keyword in critical_keywords):
            return UrgencyLevel.CRITICAL
        elif sla_hours < 2:
            return UrgencyLevel.HIGH
        elif any(keyword in text for keyword in high_keywords):
            return UrgencyLevel.HIGH
        elif any(keyword in text for keyword in low_keywords):
            return UrgencyLevel.LOW
        else:
            return UrgencyLevel.MEDIUM
    
    def _determine_sentiment(self, text: str) -> tuple[SentimentType, float]:
        """Determine sentiment and intensity"""
        
        # Positive indicators
        positive_keywords = ['thank', 'great', 'love', 'excellent', 'perfect', 
                           'wonderful', 'appreciate', 'happy']
        
        # Negative indicators
        negative_keywords = ['frustrated', 'angry', 'terrible', 'awful', 'worst',
                           'unacceptable', 'disappointed', 'horrible', 'cannot']
        
        positive_count = sum(1 for keyword in positive_keywords if keyword in text)
        negative_count = sum(1 for keyword in negative_keywords if keyword in text)
        
        if positive_count > negative_count:
            intensity = min(0.5 + (positive_count * 0.15), 1.0)
            return SentimentType.POSITIVE, intensity
        elif negative_count > positive_count:
            intensity = min(0.5 + (negative_count * 0.15), 1.0)
            return SentimentType.NEGATIVE, intensity
        else:
            return SentimentType.NEUTRAL, 0.5
    
    def _generate_summary(self, text: str) -> str:
        """Generate a summary (first sentence or 100 chars)"""
        # Take first sentence or first 100 chars
        first_sentence = text.split('.')[0] if '.' in text else text
        summary = first_sentence[:97] + "..." if len(first_sentence) > 100 else first_sentence
        return summary.strip()
    
    def _calculate_confidence(self, text: str, urgency: UrgencyLevel) -> float:
        """Calculate confidence based on text clarity"""
        
        # Higher confidence for clear, detailed tickets
        word_count = len(text.split())
        
        # Base confidence
        if word_count > 50:
            base = 0.8
        elif word_count > 20:
            base = 0.7
        else:
            base = 0.6
        
        # Adjust for urgency clarity
        if urgency == UrgencyLevel.CRITICAL and any(word in text for word in ['down', 'outage', 'critical']):
            base = min(base + 0.15, 0.95)
        
        return round(base, 2)
    
    async def generate_signals_async(self, ticket_text: str, customer_tier: str, sla_hours: float) -> LLMSignals:
        """Async version"""
        return self.generate_signals(ticket_text, customer_tier, sla_hours)


# Global instance
mock_llm_service = MockLLMService()