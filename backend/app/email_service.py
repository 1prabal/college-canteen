import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from .config import settings

def _send_smtp_email_sync(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email

        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        print(f"[EMAIL SERVICE] Successfully sent email to {to_email}: {subject}")
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {str(e)}")

async def send_email_notification(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    """
    Asynchronously sends an email notification.
    If SMTP credentials are not configured, prints an informational simulation log without failing.
    """
    if not to_email:
        return

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL SIMULATION] Mode=No-SMTP -> To: {to_email} | Subject: {subject} | Body preview: {body[:100]}...")
        return

    # Run blocking SMTP call in background thread pool to keep event loop unblocked
    asyncio.create_task(asyncio.to_thread(_send_smtp_email_sync, to_email, subject, body, html_body))
