# UniNotesHub Authentication System Changes

## Overview

This document summarizes the changes made to implement OTP-based email authentication and improve the backend folder structure.

## Changes Made

### 1. Backend Folder Structure Reorganization

**Before:**
- All models were in `app/db/models.py` (single large file)
- Empty `app/models/` folder

**After:**
- Proper model organization in `app/models/`:
  - `base.py` - Base model and UUID type
  - `user.py` - User model with OTP fields
  - `academic.py` - University, Program, Branch, Semester, Subject
  - `content.py` - Paper, Note, Tag models
  - `interaction.py` - Download, Bookmark, Rating, Report models
  - `activity.py` - UserActivity model
  - `notification.py` - Notification model
  - `audit.py` - AuditLog model
  - `__init__.py` - Imports all models

### 2. OTP Authentication Implementation

#### A. Database Changes
- **Migration**: `2025_09_17_1144-68b6a0b95065_add_otp_fields_to_users.py`
- **New User fields**:
  - `otp_code` - 6-digit OTP
  - `otp_expires_at` - OTP expiration timestamp
  - `otp_attempts` - Failed verification attempts counter
  - `otp_last_sent_at` - Rate limiting timestamp
  - `password_hash` - Made nullable for OTP-only login

#### B. New Services
- **OTP Service** (`app/services/otp.py`):
  - `generate_otp()` - Generate 6-digit numeric OTP
  - `send_login_otp()` - Send OTP via email with rate limiting
  - `verify_otp()` - Verify OTP with attempt limiting
  - `clear_expired_otps()` - Cleanup expired OTPs

#### C. Email Service Updates
- **New OTP Email** (`app/services/email.py`):
  - `send_otp_email()` - Send beautifully formatted OTP email
  - `_get_otp_email_template()` - HTML template for OTP emails

#### D. New API Endpoints
- **POST `/auth/send-otp`** - Request OTP for email
- **POST `/auth/verify-otp`** - Verify OTP and login

### 3. User Model Enhancements

The User model now includes:
```python
# OTP fields for email-based login
otp_code = Column(String(10), nullable=True)
otp_expires_at = Column(DateTime(timezone=True), nullable=True)
otp_attempts = Column(Integer, default=0, nullable=False)
otp_last_sent_at = Column(DateTime(timezone=True), nullable=True)

# Helper methods
def is_otp_valid(self) -> bool
def can_request_new_otp(self, cooldown_minutes: int = 1) -> bool
```

### 4. Authentication Flow

#### Traditional Flow (Still Available)
1. Register → Email Verification → Login with Password

#### New OTP Flow
1. **Send OTP**: `POST /auth/send-otp` with `{"email": "user@example.com"}`
2. **Verify OTP**: `POST /auth/verify-otp` with `{"email": "user@example.com", "otp": "123456"}`
3. **Get Tokens**: Response includes access/refresh tokens and user data

### 5. Security Features

#### OTP Security
- **Expiration**: OTPs expire in 10 minutes
- **Attempt Limiting**: Max 5 attempts per OTP
- **Rate Limiting**: 1-minute cooldown between OTP requests
- **Auto-cleanup**: Expired OTPs are automatically cleared
- **Secure Generation**: Cryptographically secure random OTPs

#### Email Security
- Professional HTML email templates
- Clear security warnings
- Expiration time clearly displayed

### 6. Backward Compatibility

- **Existing authentication** continues to work
- **Email verification** flow unchanged
- **Password-based login** still available
- **All existing endpoints** remain functional

## API Examples

### Request OTP
```bash
POST /auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

### Verify OTP
```bash
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "first_name": null,
    "last_name": null,
    "role": "student",
    "is_email_verified": true
  },
  "message": "Login successful"
}
```

## Database Migration

To apply the changes, run:
```bash
cd backend
alembic upgrade head
```

## Configuration

No additional configuration required. The system uses existing email settings.

## Testing

The OTP system can be tested by:
1. Requesting an OTP via `POST /auth/send-otp`
2. Checking email (or logs in development mode)
3. Verifying the OTP via `POST /auth/verify-otp`

## Benefits

### User Experience
- **Faster login** - No need to remember passwords
- **Auto-registration** - New users are created automatically
- **Secure** - Time-limited, single-use codes
- **Familiar** - Similar to other modern apps

### Security
- **No password storage** for OTP-only users
- **Time-based expiration**
- **Rate limiting** prevents abuse
- **Attempt limiting** prevents brute force

### Development
- **Clean architecture** - Well-organized models
- **Maintainable code** - Separated concerns
- **Extensible** - Easy to add new auth methods
- **Backward compatible** - No breaking changes

## Future Enhancements

Potential future improvements:
- SMS OTP support
- TOTP/Authenticator app support
- Biometric authentication
- Social login integration
- Admin dashboard for OTP management

## Files Modified/Created

### Created Files:
- `backend/app/models/` (all model files)
- `backend/app/services/otp.py`
- `backend/alembic/versions/2025_09_17_1144-68b6a0b95065_add_otp_fields_to_users.py`

### Modified Files:
- `backend/app/routers/auth.py` - Added OTP endpoints
- `backend/app/services/email.py` - Added OTP email support
- `backend/app/db/base.py` - Updated imports

The system is now ready for OTP-based authentication while maintaining full backward compatibility with existing authentication methods.
