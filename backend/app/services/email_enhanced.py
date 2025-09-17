"""
Enhanced Email Service supporting both SMTP and AWS SES
"""
import logging
from typing import List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import ssl
from jinja2 import Environment, BaseLoader
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class EmailService:
    """Enhanced service for sending emails supporting both SMTP and AWS SES."""
    
    def __init__(self):
        self.provider = settings.EMAIL_PROVIDER.lower()
        
        # SMTP Configuration
        self.smtp_server = settings.EMAIL_SMTP_HOST
        self.smtp_port = settings.EMAIL_SMTP_PORT
        self.username = settings.EMAIL_USER
        self.password = settings.EMAIL_PASS
        self.from_email = settings.EMAIL_FROM
        self.use_tls = settings.EMAIL_USE_TLS
        
        # AWS SES Configuration
        self.aws_region = settings.SES_REGION or settings.AWS_REGION
        self.ses_from_email = settings.SES_FROM_EMAIL or settings.EMAIL_FROM
        
        # Initialize SES client if using SES
        self.ses_client = None
        if self.provider == "ses":
            self._init_ses_client()
        
        # Initialize Jinja2 environment for templates
        self.jinja_env = Environment(loader=BaseLoader())
    
    def _init_ses_client(self):
        """Initialize AWS SES client."""
        try:
            # Check for AWS credentials
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.ses_client = boto3.client(
                    'ses',
                    region_name=self.aws_region,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
            else:
                # Use default credentials (IAM role, environment, etc.)
                self.ses_client = boto3.client('ses', region_name=self.aws_region)
            
            logger.info(f"SES client initialized for region: {self.aws_region}")
        except Exception as e:
            logger.error(f"Failed to initialize SES client: {e}")
            # Fallback to SMTP
            logger.warning("Falling back to SMTP for email delivery")
            self.provider = "smtp"
    
    def _is_email_properly_configured(self) -> bool:
        """Check if email is properly configured."""
        if self.provider == "ses":
            return self.ses_client is not None
        
        return (
            self.smtp_server and 
            self.username and 
            self.password and 
            self.from_email and
            # Basic check for gmail app password format (16 chars, no spaces if app password)
            (len(self.password.replace(' ', '')) >= 8)
        )
    
    async def send_email_smtp(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send email using SMTP."""
        try:
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
            
            logger.info(f"Email sent successfully via SMTP to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_emails}: {str(e)}")
            return False
    
    async def send_email_ses(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send email using AWS SES."""
        try:
            if not self.ses_client:
                raise Exception("SES client not initialized")
            
            # Prepare email content
            body = {}
            if html_content:
                body['Html'] = {'Data': html_content, 'Charset': 'UTF-8'}
            if text_content:
                body['Text'] = {'Data': text_content, 'Charset': 'UTF-8'}
            
            # Send email
            response = self.ses_client.send_email(
                Source=self.ses_from_email,
                Destination={'ToAddresses': to_emails},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': body
                }
            )
            
            logger.info(f"Email sent successfully via SES to {to_emails}. MessageId: {response['MessageId']}")
            return True
            
        except ClientError as e:
            logger.error(f"SES Client Error: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            return False
        except Exception as e:
            logger.error(f"Failed to send email via SES to {to_emails}: {str(e)}")
            return False
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email to recipients using configured provider."""
        try:
            # Check if we're in development mode and email might not be configured
            if settings.ENVIRONMENT == "development" and not self._is_email_properly_configured():
                logger.warning(f"Email not configured for development. Skipping email to {to_emails}")
                logger.info(f"[DEV MODE] Email content:\n  To: {to_emails}\n  Subject: {subject}\n  Body: {text_content or html_content[:200]}...")
                return True  # Return True to not break auth flows in development
            
            # Send email based on provider
            if self.provider == "ses":
                return await self.send_email_ses(to_emails, subject, html_content, text_content)
            else:
                return await self.send_email_smtp(to_emails, subject, html_content, text_content)
                
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            if settings.ENVIRONMENT == "development":
                logger.warning("Email failed in development mode, continuing anyway")
                return True
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
        template_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Login Code</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .otp-code { 
                    font-size: 24px; 
                    font-weight: bold; 
                    text-align: center; 
                    background-color: #e9ecef; 
                    padding: 15px; 
                    border-radius: 5px; 
                    letter-spacing: 2px; 
                }
                .footer { text-align: center; margin-top: 20px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{{ app_name }}</h1>
                </div>
                <div class="content">
                    <h2>Your Login Code</h2>
                    <p>Use the following code to complete your login:</p>
                    <div class="otp-code">{{ otp_code }}</div>
                    <p>This code will expire in {{ expiry_minutes }} minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return self.jinja_env.from_string(template_content)


# Create email service instance
email_service = EmailService()
