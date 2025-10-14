from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = Field(..., description="Name of your application")
    ENV: str = Field(..., description="Environment (e.g., development, production)")
    
    # Database settings
    NEON_CONNECTION_STRING: str = Field(..., description="Neon Database connection string")
    DATABASE_URL: str = Field(..., description="Database connection string")
    
    # JWT settings
    JWT_SECRET: str = Field(..., min_length=16, description="Secret key for JWT encoding")
    JWT_ALGORITHM: str = Field("HS256", description="Algorithm used for JWT encoding")
    JWT_EXPIRE_MINUTES: int = Field(30, description="JWT token expiration time in minutes")
    
    # Optional settings with defaults
    DEBUG: bool = Field(False, description="Enable debug mode")
    HOST: str = Field("0.0.0.0", description="Host to bind the application to")
    PORT: int = Field(8000, description="Port to run the application on")
    
    # Configuration for loading environment variables
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Create settings instance
settings = Settings()