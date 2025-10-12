# Email Verification Setup

## Admin Email Configuration

The email verification system uses the admin email to send verification emails to users.

**Admin Email:** `agri-connect25@gmail.com`

## Setup Instructions

### 1. Enable Gmail App Password

To send emails from Gmail, you need to create an App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "How you sign in to Google," select **2-Step Verification** (enable it if not already enabled)
4. At the bottom of the page, select **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Agri-Connect API" as the name
7. Click **Generate**
8. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### 2. Add to Environment Variables

Add the following to your `.env` file in the `packages/api` directory:

```env
# Email Configuration
ADMIN_EMAIL_PASSWORD=your_16_character_app_password_here
FRONTEND_URL=http://localhost:5174
```

**Example:**
```env
ADMIN_EMAIL_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5174
```

### 3. How It Works

1. **User requests email verification** from their profile security section
2. **Backend generates a unique token** (valid for 24 hours)
3. **Email is sent from** `agri-connect25@gmail.com` with a verification link
4. **User clicks the link** to verify their email
5. **Account is marked as verified** in the database

## Email Templates

### Verification Email
- **From:** Agri-Connect <agri-connect25@gmail.com>
- **Subject:** Verify Your Email Address - Agri-Connect
- **Contains:** Branded HTML email with verification button and link
- **Expiry:** 24 hours

### Development Mode

If `ADMIN_EMAIL_PASSWORD` is not set, the system runs in development mode:
- Emails are not actually sent
- Verification URLs are logged to console
- Verification URLs are returned in API response for testing

## Testing

### Development Testing (without email credentials):
1. User clicks "Send Verification" button
2. Check console logs for verification URL
3. Copy the URL and open in browser
4. Email will be marked as verified

### Production Testing (with email credentials):
1. User clicks "Send Verification" button
2. Check email inbox for verification email
3. Click "Verify Email Address" button in email
4. Email will be marked as verified

## Security Features

- ✅ Tokens are cryptographically secure (32 bytes random)
- ✅ Tokens expire after 24 hours
- ✅ Tokens are single-use (deleted after verification)
- ✅ Email sent from official admin email
- ✅ HTML email with professional branding
- ✅ Fallback to console logging in development

## Troubleshooting

### Email not received?
1. Check spam/junk folder
2. Verify `ADMIN_EMAIL_PASSWORD` is correct
3. Check console logs for errors
4. Ensure 2-Step Verification is enabled on Gmail account
5. Verify App Password is for "Mail" type

### "Failed to send verification email" error?
1. Check if `ADMIN_EMAIL_PASSWORD` is set in `.env`
2. Verify the App Password is correct (no spaces)
3. Check if Gmail account has 2-Step Verification enabled
4. Try generating a new App Password

### Token expired?
- Tokens are valid for 24 hours
- Request a new verification email

## API Endpoints

### Send Verification Email
```
POST /api/users/me/email/send-verification
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully from agri-connect25@gmail.com",
  "verificationUrl": "http://localhost:5174/verify-email?token=..." // Only in development
}
```

### Verify Email
```
POST /api/users/email/verify
Content-Type: application/json

{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Check Email Status
```
GET /api/users/me/email/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "email": "user@example.com",
  "emailVerified": true,
  "hasEmail": true
}
```

## Support

For issues or questions, contact the development team or check the main README.md file.
