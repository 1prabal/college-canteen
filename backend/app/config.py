import os
from typing import List

class Settings:
    # Environment & Security
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusbites-insecure-dev-secret-key-change-in-prod-32bytesmin")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./canteen.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))

    # CORS
    _frontend_urls_raw: str = os.getenv(
        "FRONTEND_URL", 
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self._frontend_urls_raw.split(",") if origin.strip()]

    # Payment Gateway
    PAYMENT_MODE: str = os.getenv("PAYMENT_MODE", "SANDBOX").upper()
    PAYMENT_WEBHOOK_SECRET: str = os.getenv("PAYMENT_WEBHOOK_SECRET", "campusbites-webhook-signing-secret")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    UPI_MERCHANT_VPA: str = os.getenv("UPI_MERCHANT_VPA", "canteen@upi")
    UPI_MERCHANT_NAME: str = os.getenv("UPI_MERCHANT_NAME", "CampusBites Food Court")

    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "notifications@campusbites.internal")

    # Rate Limiting
    PICKUP_VERIFICATION_MAX_ATTEMPTS: int = int(os.getenv("PICKUP_VERIFICATION_MAX_ATTEMPTS", "5"))
    PICKUP_VERIFICATION_LOCKOUT_MINUTES: int = int(os.getenv("PICKUP_VERIFICATION_LOCKOUT_MINUTES", "15"))

settings = Settings()
