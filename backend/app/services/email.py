import logging
from typing import List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import ssl
from jinja2 import Environment, BaseLoader
from pathlib import Path

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""
    
    def __init__(self):
        self.smtp_server = settings.EMAIL_SMTP_HOST
        self.smtp_port = settings.EMAIL_SMTP_PORT
        self.username = settings.EMAIL_USER
        self.password = settings.EMAIL_PASS
        self.from_email = settings.EMAIL_FROM
        self.use_tls = settings.EMAIL_USE_TLS
        
        # Initialize Jinja2 environment for templates
        self.jinja_env = Environment(loader=BaseLoader())
    
    def _is_email_properly_configured(self) -> bool:
        """Check if email is properly configured."""
        return (
            self.smtp_server and 
            self.username and 
            self.password and 
            self.from_email and
            # Basic check for gmail app password format (16 chars, no spaces if app password)
            (len(self.password.replace(' ', '')) >= 8)
        )
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email to recipients."""
        try:
            # Check if we're in development mode and email might not be configured
            if settings.ENVIRONMENT == "development" and not self._is_email_properly_configured():
                logger.warning(f"Email not configured for development. Skipping email to {to_emails}")
                logger.info(f"[DEV MODE] Email content:\n  To: {to_emails}\n  Subject: {subject}\n  Body: {text_content or html_content[:200]}...")
                return True  # Return True to not break auth flows in development
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = ", ".join(to_emails)
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create SMTP connection
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls(context=context)
                
                server.login(self.username, self.password)
                server.sendmail(self.from_email, to_emails, message.as_string())
            
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed for {to_emails}: {str(e)}")
            if settings.ENVIRONMENT == "development":
                logger.warning("Email authentication failed in development mode, continuing anyway")
                logger.info(f"[DEV MODE] Email content:\n  To: {to_emails}\n  Subject: {subject}\n  Body: {text_content or html_content[:200]}...")
                return True  # Don't fail auth flows in development
            return False
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            if settings.ENVIRONMENT == "development":
                logger.warning("Email failed in development mode, continuing anyway")
                return True
            return False
    
    async def send_verification_email(self, email: str, verification_token: str) -> bool:
        """Send email verification email."""
        
        # In production, this should be your frontend URL
        base_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
        verification_url = f"{base_url}/auth/verify-email?token={verification_token}"
        
        subject = "Verify your UniNotesHub account"
        
        html_content = self._get_verification_email_template().render(
            verification_url=verification_url,
            app_name=settings.APP_NAME,
        )
        
        text_content = f"""
        Welcome to {settings.APP_NAME}!
        
        Please verify your email address by clicking the link below:
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with us, please ignore this email.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return await self.send_email([email], subject, html_content, text_content)
    
    async def send_password_reset_email(self, email: str, reset_token: str) -> bool:
        """Send password reset email."""
        
        base_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
        reset_url = f"{base_url}/auth/reset-password?token={reset_token}"
        
        subject = "Reset your UniNotesHub password"
        
        html_content = self._get_password_reset_email_template().render(
            reset_url=reset_url,
            app_name=settings.APP_NAME,
        )
        
        text_content = f"""
        Hello,
        
        We received a request to reset your password for your {settings.APP_NAME} account.
        
        Click the link below to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return await self.send_email([email], subject, html_content, text_content)
    
    async def send_welcome_email(self, email: str, first_name: str = "") -> bool:
        """Send welcome email after successful verification."""
        
        base_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
        
        subject = f"Welcome to {settings.APP_NAME}!"
        
        html_content = self._get_welcome_email_template().render(
            first_name=first_name or "there",
            app_name=settings.APP_NAME,
            base_url=base_url,
        )
        
        text_content = f"""
        Hi {first_name or 'there'}!
        
        Welcome to {settings.APP_NAME}! Your account has been successfully verified.
        
        You can now:
        - Browse and search question papers
        - Upload your own papers to help fellow students
        - Bookmark papers for quick access
        - Download papers for your studies
        
        Visit {base_url} to get started!
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return await self.send_email([email], subject, html_content, text_content)
    
    def _get_verification_email_template(self):
        """Get email verification template."""
        template_str = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ app_name }}</h1>
        <p>Verify Your Account</p>
    </div>
    <div class="content">
        <h2>Welcome!</h2>
        <p>Thank you for creating an account with {{ app_name }}. To complete your registration and start accessing our platform, please verify your email address.</p>
        
        <p style="text-align: center;">
            <a href="{{ verification_url }}" class="button">Verify Email Address</a>
        </p>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">{{ verification_url }}</p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>If you didn't create an account with us, please ignore this email.</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 {{ app_name }}. All rights reserved.</p>
    </div>
</body>
</html>
        '''
        return self.jinja_env.from_string(template_str)
    
    def _get_password_reset_email_template(self):
        """Get password reset template."""
        template_str = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ app_name }}</h1>
        <p>Password Reset Request</p>
    </div>
    <div class="content">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <p style="text-align: center;">
            <a href="{{ reset_url }}" class="button">Reset Password</a>
        </p>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">{{ reset_url }}</p>
        
        <div class="warning">
            <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
        </div>
        
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 {{ app_name }}. All rights reserved.</p>
    </div>
</body>
</html>
        '''
        return self.jinja_env.from_string(template_str)
    
    def _get_welcome_email_template(self):
        """Get welcome email template."""
        template_str = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ app_name }}!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
        .features { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .features ul { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome to {{ app_name }}!</h1>
        <p>Your account is now active</p>
    </div>
    <div class="content">
        <h2>Hi {{ first_name }}!</h2>
        <p>Congratulations! Your {{ app_name }} account has been successfully verified and you're all set to start exploring.</p>
        
        <div class="features">
            <h3>What you can do now:</h3>
            <ul>
                <li><strong>Browse & Search:</strong> Find question papers by university, program, and subject</li>
                <li><strong>Upload Papers:</strong> Share your question papers to help fellow students</li>
                <li><strong>Bookmark:</strong> Save papers for quick access later</li>
                <li><strong>Download:</strong> Get the papers you need for your studies</li>
            </ul>
        </div>
        
        <p style="text-align: center;">
            <a href="{{ base_url }}" class="button">Start Exploring</a>
        </p>
        
        <p>If you have any questions or need help, don't hesitate to reach out to our support team.</p>
        
        <p>Happy studying!</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 {{ app_name }}. All rights reserved.</p>
    </div>
</body>
</html>
        '''
        return self.jinja_env.from_string(template_str)


# Global email service instance
email_service = EmailService()
