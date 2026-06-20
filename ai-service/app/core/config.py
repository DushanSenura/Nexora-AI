from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    frontend_url: str = "http://localhost:5173"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    qdrant_url: str = "http://localhost:6333"
    image_generation_base_url: str = "http://localhost:7860"
    image_generation_steps: int = 20
    image_generation_width: int = 512
    image_generation_height: int = 512


settings = Settings()
