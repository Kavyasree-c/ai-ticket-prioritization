
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenAI Configuration
    openai_api_key: str
    
    # Application Configuration
    app_name: str = "AI Ticket Prioritization System"
    app_version: str = "1.0.0"
    debug_mode: bool = True
    
    # LLM Configuration
    llm_model: str = "gpt-4o-mini"
    llm_max_tokens: int = 500
    llm_temperature: float = 0.3
    
    # Priority Scoring Weights
    weight_urgency: float = 0.4
    weight_sla: float = 0.4
    weight_customer_tier: float = 0.2
    
    # CORS Settings
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://*.vercel.app,https://ai-ticket-prioritization-git-main-kavyas-projects-91c72349.vercel.app,https://ai-ticket-prioritization.vercel.app"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()