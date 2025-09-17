import logging
import os
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from enum import Enum
import httpx
from jinja2 import Environment, BaseLoader

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class EmailProvider(str, Enum):
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    AWS_SES = "aws_ses"
    POSTMARK = "postmark"
    BREVO = "brevo"  # formerly Sendinblue
    SMTP = "smtp"  # fallback to SMTP


class BaseEmailProvider(ABC):
    """Abstract base class for email providers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    @abstractmethod
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Send an email via the provider."""
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the provider is properly configured."""
        pass


class SendGridProvider(BaseEmailProvider):
    """SendGrid email provider."""
    
    def is_configured(self) -> bool:
        return bool(self.config.get("api_key"))
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        api_key = self.config.get("api_key")
        if not api_key:
            return False
        
        from_email = from_email or self.config.get("from_email", settings.EMAIL_FROM)
        from_name = from_name or self.config.get("from_name", settings.APP_NAME)
        
        payload = {
            "personalizations": [{
                "to": [{"email": email} for email in to_emails]
            }],
            "from": {
                "email": from_email,
                "name": from_name
            },
            "subject": subject,
            "content": []
        }
        
        if text_content:
            payload["content"].append({
                "type": "text/plain",
                "value": text_content
            })
        
        payload["content"].append({
            "type": "text/html",
            "value": html_content
        })
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 202:
                    logger.info(f"Email sent successfully via SendGrid to {to_emails}")
                    return True
                else:
                    logger.error(f"SendGrid API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"SendGrid email failed: {e}")
            return False


class MailgunProvider(BaseEmailProvider):
    """Mailgun email provider."""
    
    def is_configured(self) -> bool:
        return bool(self.config.get("api_key") and self.config.get("domain"))
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        api_key = self.config.get("api_key")
        domain = self.config.get("domain")
        
        if not api_key or not domain:
            return False
        
        from_email = from_email or self.config.get("from_email", settings.EMAIL_FROM)
        from_name = from_name or self.config.get("from_name", settings.APP_NAME)
        
        from_address = f"{from_name} <{from_email}>" if from_name else from_email
        
        data = {
            "from": from_address,
            "to": to_emails,
            "subject": subject,
            "html": html_content
        }
        
        if text_content:
            data["text"] = text_content
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.mailgun.net/v3/{domain}/messages",
                    data=data,
                    auth=("api", api_key)
                )
                
                if response.status_code == 200:
                    logger.info(f"Email sent successfully via Mailgun to {to_emails}")
                    return True
                else:
                    logger.error(f"Mailgun API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Mailgun email failed: {e}")
            return False


class PostmarkProvider(BaseEmailProvider):
    """Postmark email provider."""
    
    def is_configured(self) -> bool:
        return bool(self.config.get("api_key"))
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        api_key = self.config.get("api_key")
        if not api_key:
            return False
        
        from_email = from_email or self.config.get("from_email", settings.EMAIL_FROM)
        from_name = from_name or self.config.get("from_name", settings.APP_NAME)
        
        from_address = f"{from_name} <{from_email}>" if from_name else from_email
        
        payload = {
            "From": from_address,
            "To": ", ".join(to_emails),
            "Subject": subject,
            "HtmlBody": html_content
        }
        
        if text_content:
            payload["TextBody"] = text_content
        
        headers = {
            "X-Postmark-Server-Token": api_key,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.postmarkapp.com/email",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    logger.info(f"Email sent successfully via Postmark to {to_emails}")
                    return True
                else:
                    logger.error(f"Postmark API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Postmark email failed: {e}")
            return False


class BrevoProvider(BaseEmailProvider):
    """Brevo (formerly Sendinblue) email provider."""
    
    def is_configured(self) -> bool:
        return bool(self.config.get("api_key"))
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        api_key = self.config.get("api_key")
        if not api_key:
            return False
        
        from_email = from_email or self.config.get("from_email", settings.EMAIL_FROM)
        from_name = from_name or self.config.get("from_name", settings.APP_NAME)
        
        payload = {
            "sender": {
                "email": from_email,
                "name": from_name
            },
            "to": [{"email": email} for email in to_emails],
            "subject": subject,
            "htmlContent": html_content
        }
        
        if text_content:
            payload["textContent"] = text_content
        
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 201:
                    logger.info(f"Email sent successfully via Brevo to {to_emails}")
                    return True
                else:
                    logger.error(f"Brevo API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Brevo email failed: {e}")
            return False


class SMTPProvider(BaseEmailProvider):
    """Fallback SMTP provider."""
    
    def is_configured(self) -> bool:
        return bool(
            self.config.get("smtp_host") and 
            self.config.get("smtp_user") and 
            self.config.get("smtp_pass")
        )
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        import smtplib
        import ssl
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        smtp_host = self.config.get("smtp_host")
        smtp_port = self.config.get("smtp_port", 587)
        smtp_user = self.config.get("smtp_user")
        smtp_pass = self.config.get("smtp_pass")
        use_tls = self.config.get("use_tls", True)
        
        from_email = from_email or self.config.get("from_email", settings.EMAIL_FROM)
        
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = from_email
            message["To"] = ", ".join(to_emails)
            
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            context = ssl.create_default_context()
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if use_tls:
                    server.starttls(context=context)
                
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, to_emails, message.as_string())
            
            logger.info(f"Email sent successfully via SMTP to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP email failed: {e}")
            return False


class TransactionalEmailService:
    """Main service for sending transactional emails."""
    
    def __init__(self):
        self.jinja_env = Environment(loader=BaseLoader())
        self.providers = self._initialize_providers()
        self.primary_provider = self._get_primary_provider()
    
    def _initialize_providers(self) -> Dict[EmailProvider, BaseEmailProvider]:
        """Initialize all available email providers."""
        providers = {}
        
        # SendGrid
        if sendgrid_key := os.getenv("SENDGRID_API_KEY"):
            providers[EmailProvider.SENDGRID] = SendGridProvider({
                "api_key": sendgrid_key,
                "from_email": os.getenv("SENDGRID_FROM_EMAIL", settings.EMAIL_FROM),
                "from_name": os.getenv("SENDGRID_FROM_NAME", settings.APP_NAME)
            })
        
        # Mailgun
        if mailgun_key := os.getenv("MAILGUN_API_KEY"):
            providers[EmailProvider.MAILGUN] = MailgunProvider({
                "api_key": mailgun_key,
                "domain": os.getenv("MAILGUN_DOMAIN"),
                "from_email": os.getenv("MAILGUN_FROM_EMAIL", settings.EMAIL_FROM),
                "from_name": os.getenv("MAILGUN_FROM_NAME", settings.APP_NAME)
            })
        
        # Postmark
        if postmark_key := os.getenv("POSTMARK_API_KEY"):
            providers[EmailProvider.POSTMARK] = PostmarkProvider({
                "api_key": postmark_key,
                "from_email": os.getenv("POSTMARK_FROM_EMAIL", settings.EMAIL_FROM),
                "from_name": os.getenv("POSTMARK_FROM_NAME", settings.APP_NAME)
            })
        
        # Brevo
        if brevo_key := os.getenv("BREVO_API_KEY"):
            providers[EmailProvider.BREVO] = BrevoProvider({
                "api_key": brevo_key,
                "from_email": os.getenv("BREVO_FROM_EMAIL", settings.EMAIL_FROM),
                "from_name": os.getenv("BREVO_FROM_NAME", settings.APP_NAME)
            })
        
        # SMTP fallback
        providers[EmailProvider.SMTP] = SMTPProvider({
            "smtp_host": settings.EMAIL_SMTP_HOST,
            "smtp_port": getattr(settings, "EMAIL_SMTP_PORT", 587),
            "smtp_user": settings.EMAIL_USER,
            "smtp_pass": settings.EMAIL_PASS,
            "use_tls": getattr(settings, "EMAIL_USE_TLS", True),
            "from_email": settings.EMAIL_FROM
        })
        
        return providers
    
    def _get_primary_provider(self) -> Optional[BaseEmailProvider]:
        """Get the primary email provider to use."""
        # Check environment variable for preferred provider
        preferred = os.getenv("EMAIL_PROVIDER", "").lower()
        
        # Try preferred provider first
        if preferred:
            try:
                provider_enum = EmailProvider(preferred)
                if provider_enum in self.providers and self.providers[provider_enum].is_configured():
                    logger.info(f"Using {preferred} as primary email provider")
                    return self.providers[provider_enum]
            except ValueError:
                logger.warning(f"Unknown email provider: {preferred}")
        
        # Try providers in order of preference
        preferred_order = [
            EmailProvider.SENDGRID,
            EmailProvider.POSTMARK,
            EmailProvider.MAILGUN,
            EmailProvider.BREVO,
            EmailProvider.SMTP
        ]
        
        for provider_type in preferred_order:
            if provider_type in self.providers and self.providers[provider_type].is_configured():
                logger.info(f"Using {provider_type.value} as primary email provider")
                return self.providers[provider_type]
        
        logger.warning("No email provider is properly configured")
        return None
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Send an email using the primary provider with fallback."""
        
        if not self.primary_provider:
            if settings.ENVIRONMENT == "development":
                logger.warning(f"No email provider configured. Email content:\n  To: {to_emails}\n  Subject: {subject}\n  Body: {text_content or html_content[:200]}...")
                return True
            return False
        
        # Try primary provider
        success = await self.primary_provider.send_email(
            to_emails, subject, html_content, text_content, from_email, from_name
        )
        
        if success:
            return True
        
        # Try SMTP fallback if primary provider failed and it's not SMTP
        smtp_provider = self.providers.get(EmailProvider.SMTP)
        if (smtp_provider and 
            smtp_provider != self.primary_provider and 
            smtp_provider.is_configured()):
            logger.info("Primary provider failed, trying SMTP fallback")
            return await smtp_provider.send_email(
                to_emails, subject, html_content, text_content, from_email, from_name
            )
        
        logger.error("All email providers failed")
        return False
    
    async def send_otp_email(self, email: str, otp_code: str, expiry_minutes: int = 10) -> bool:
        """Send OTP email for login."""
        
        subject = f"Your {settings.APP_NAME} Login Code"
        
        html_content = self._get_otp_email_template().render(
            otp_code=otp_code,
            expiry_minutes=expiry_minutes,
            app_name=settings.APP_NAME,
        )
        
        text_content = f"""
        Your {settings.APP_NAME} login code is: {otp_code}
        
        This code will expire in {expiry_minutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return await self.send_email([email], subject, html_content, text_content)
    
    def _get_otp_email_template(self):
        """Get OTP email template."""
        template_str = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .otp-code { background-color: white; border: 2px solid #6366f1; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; letter-spacing: 8px; color: #6366f1; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ app_name }}</h1>
        <p>Your Login Code</p>
    </div>
    <div class="content">
        <h2>Login to Your Account</h2>
        <p>Use the code below to complete your login:</p>
        
        <div class="otp-code">{{ otp_code }}</div>
        
        <div class="warning">
            <p><strong>Important:</strong> This code will expire in {{ expiry_minutes }} minutes.</p>
        </div>
        
        <p>If you didn't request this login code, please ignore this email and ensure your account is secure.</p>
        
        <p><strong>Security tip:</strong> Never share this code with anyone. {{ app_name }} will never ask for this code via phone or email.</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 {{ app_name }}. All rights reserved.</p>
    </div>
</body>
</html>
        '''
        return self.jinja_env.from_string(template_str)


# Global email service instance
transactional_email_service = TransactionalEmailService()
