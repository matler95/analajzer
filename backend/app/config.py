from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./analajzer.db"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_days: int = 7
    cepik_cache_ttl_seconds: int = 86400
    odometer_tolerance_km: int = 999
    cepik_rate_limit_per_minute: int = 10
    redis_url: str | None = None
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()
