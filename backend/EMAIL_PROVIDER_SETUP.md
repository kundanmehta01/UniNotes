# Email Provider Setup for OTP System

This document explains how to configure email providers for the OTP authentication system.

## Supported Email Providers

The system supports multiple transactional email providers with automatic fallback:

1. **SendGrid** (Recommended)
2. **Mailgun**
3. **Postmark**
4. **Brevo** (formerly Sendinblue)
5. **SMTP** (fallback)

## Configuration

Add your email provider credentials to the environment variables or `.env` file:

### SendGrid
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="UniNotesHub"
EMAIL_PROVIDER=sendgrid
```

### Mailgun
```bash
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
MAILGUN_FROM_NAME="UniNotesHub"
EMAIL_PROVIDER=mailgun
```

### Postmark
```bash
POSTMARK_API_KEY=your_postmark_api_key
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
POSTMARK_FROM_NAME="UniNotesHub"
EMAIL_PROVIDER=postmark
```

### Brevo (Sendinblue)
```bash
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME="UniNotesHub"
EMAIL_PROVIDER=brevo
```

### SMTP Fallback
```bash
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_USE_TLS=true
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=smtp
```

## Provider Priority

If no `EMAIL_PROVIDER` is specified, the system will try providers in this order:
1. SendGrid
2. Postmark
3. Mailgun
4. Brevo
5. SMTP

## Testing Email Configuration

Run the test script to verify your email configuration:

```bash
cd backend
python test_email_config.py
```

## Development Mode

In development mode, if no email provider is configured, the system will:
- Log OTP codes to the console instead of sending emails
- Continue to function normally for testing purposes
- Display warning messages about missing email configuration

## Production Recommendations

For production use:
1. **Use SendGrid or Postmark** for reliability
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Use a dedicated sending domain**
4. **Monitor email delivery metrics**
5. **Set up webhooks** for bounce/complaint handling

## Troubleshooting

### Common Issues:

1. **"No email provider configured"**
   - Add email provider environment variables
   - Check `.env` file is loaded properly

2. **"Failed to send OTP"**
   - Verify API keys are correct
   - Check domain configuration for Mailgun
   - Ensure sender email is verified

3. **Emails going to spam**
   - Set up SPF/DKIM records
   - Use a reputable email provider
   - Avoid spam trigger words in templates

4. **Rate limiting errors**
   - Check provider sending limits
   - Implement proper retry logic
   - Monitor sending quotas

### Debug Commands:

```bash
# Test OTP system components
python test_otp_system.py

# Test email provider connection
python -c "from app.services.transactional_email import transactional_email_service; print('Provider:', transactional_email_service.primary_provider)"

# Check configuration
python -c "import os; print('EMAIL_PROVIDER:', os.getenv('EMAIL_PROVIDER', 'Not set'))"
```
