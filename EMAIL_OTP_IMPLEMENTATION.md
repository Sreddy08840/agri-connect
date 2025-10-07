# Email & Phone OTP Authentication Implementation

## Overview
This document describes the implementation of dual authentication system supporting both **email** and **phone number** with OTP verification sent via email using `agriconnect28@gmail.com`.

## Features Implemented

### 1. Backend API Changes (`packages/api/src/routes/auth.ts`)

#### Authentication Endpoints Support Both Email & Phone:
- `/auth/register` - Simple registration (mobile app)
- `/auth/login` - Simple login (mobile app)
- `/auth/register-password` - Registration with OTP (web app)
- `/auth/login-password` - Login with OTP (web app)

#### How It Works:
- Users can provide **either email OR phone** or **both**
- System checks for existing users by email OR phone
- OTP is sent to **email if provided**, otherwise to **phone**
- In development mode, OTP code is returned in API response for testing

### 2. Email Service (`packages/api/src/services/emailService.ts`)

#### New Method Added:
```typescript
async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean>
```

#### Features:
- Sends beautifully formatted HTML emails with OTP code
- Uses `agriconnect28@gmail.com` as sender (configurable via EMAIL_FROM env variable)
- OTP displayed in large, easy-to-read format
- Includes security tips and expiration notice (10 minutes)
- Falls back to console logging if email service not configured

### 3. Database Schema (`packages/api/prisma/schema.prisma`)

#### Updated User Model:
```prisma
model User {
  email  String?  @unique  // Made unique for email-based authentication
  phone  String   @unique  // Remains unique
  // ... other fields
}
```

## Configuration Required

### Environment Variables (`.env` file)

Add these to `packages/api/.env`:

```env
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=agriconnect28@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=agriconnect28@gmail.com
```

### Gmail App Password Setup:

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use that password in `EMAIL_PASS`

## Frontend Integration

### Web Application

#### Login/Register Pages Support:
- Email field (required)
- Phone field (optional)
- Password field
- OTP verification step

#### User Flow:
1. User enters email/phone + password
2. System sends OTP to email (or phone if no email)
3. User enters 6-digit OTP
4. System verifies and logs in user

### Mobile Application

#### Same dual support:
- Users can register/login with email, phone, or both
- OTP sent to email if provided
- Fallback to SMS if only phone provided

## API Request Examples

### Registration with Email:
```json
POST /auth/register-password
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "CUSTOMER"
}
```

### Registration with Phone:
```json
POST /auth/register-password
{
  "name": "John Doe",
  "phone": "+911234567890",
  "password": "SecurePass123!",
  "role": "CUSTOMER"
}
```

### Registration with Both:
```json
POST /auth/register-password
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+911234567890",
  "password": "SecurePass123!",
  "role": "CUSTOMER"
}
```

### Login with Email:
```json
POST /auth/login-password
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Login with Phone:
```json
POST /auth/login-password
{
  "phone": "+911234567890",
  "password": "SecurePass123!"
}
```

## OTP Verification

After registration/login, system returns:
```json
{
  "success": true,
  "pendingSessionId": "session-id-here",
  "code": "123456"  // Only in development mode
}
```

Then verify OTP:
```json
POST /auth/otp/verify-2fa
{
  "pendingSessionId": "session-id-here",
  "code": "123456"
}
```

## Testing

### Development Mode:
- OTP code is returned in API response
- Check console logs for email content
- No actual email sent if EMAIL_* env vars not configured

### Production Mode:
- OTP sent to actual email address
- Code not returned in API response
- Requires proper Gmail configuration

## Security Features

1. **Rate Limiting**: OTP requests are rate-limited
2. **Expiration**: OTPs expire after 10 minutes
3. **Unique Constraints**: Email and phone are unique in database
4. **Password Hashing**: Passwords hashed with bcrypt
5. **Session Management**: Pending sessions for OTP verification

## Profile Display

User profiles now show both:
- Email address (if provided)
- Phone number
- Users can update either in profile settings

## Next Steps

1. **Configure Gmail**: Set up `agriconnect28@gmail.com` with app password
2. **Update .env**: Add EMAIL_* variables
3. **Test Email**: Send test OTP to verify email service works
4. **Update Frontend**: Ensure all login/register forms support both fields
5. **Database Migration**: Run Prisma migration to update schema

## Troubleshooting

### Email Not Sending:
- Check EMAIL_* environment variables
- Verify Gmail app password is correct
- Check console logs for error messages
- Ensure 2FA is enabled on Gmail account

### OTP Not Working:
- Check if OTP has expired (10 minutes)
- Verify pendingSessionId is correct
- Check rate limiting hasn't blocked requests
- Look at backend console logs

### Database Errors:
- Run `npx prisma generate` to regenerate Prisma client
- Run `npx prisma migrate dev` to apply schema changes
- Check for duplicate email/phone in database

## Support

For issues or questions, check:
1. Backend console logs
2. Email service configuration
3. Database schema updates
4. API endpoint responses
