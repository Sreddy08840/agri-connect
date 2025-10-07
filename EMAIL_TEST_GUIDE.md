# Email Confirmation System - Quick Test Guide

## Quick Start Testing

### Option 1: Console Mode (No Email Setup Required)

The system works immediately without any email configuration. Emails will be logged to console.

1. **Start the API server:**
   ```bash
   cd packages/api
   pnpm dev
   ```

2. **Place a test order** via the web interface or API

3. **Check console output** for email details:
   ```
   ⚠️  Email service not configured. Emails will be logged to console only.
   
   📧 Email (Console Mode):
   To: customer@example.com
   Subject: Order Confirmation - ORD-1234567890
   Body: <!DOCTYPE html>...
   ```

### Option 2: Real Email Testing (Gmail)

1. **Create/Use Gmail Account** with 2FA enabled

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Create `.env` file** in `packages/api/`:
   ```bash
   cp .env.example .env
   ```

4. **Add Email Configuration** to `.env`:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

5. **Restart API Server:**
   ```bash
   pnpm dev
   ```

6. **Verify Initialization:**
   ```
   ✅ Email service initialized successfully
   ```

7. **Place Test Order** and check:
   - Console logs: `✅ Email sent successfully: <message-id>`
   - Email inbox for confirmation emails

## Testing Checklist

- [ ] API server starts without errors
- [ ] Email service initializes (check console)
- [ ] Order can be created successfully
- [ ] Order status is "CONFIRMED"
- [ ] Buyer email is sent (console or inbox)
- [ ] Seller email is sent (console or inbox)
- [ ] Email contains correct order details
- [ ] Email contains correct product information
- [ ] Email contains correct delivery address
- [ ] Email contains estimated delivery date
- [ ] Email formatting looks professional

## Sample Test Order

Use this JSON to test via API:

```json
{
  "items": [
    {
      "productId": "your-product-id",
      "qty": 5
    }
  ],
  "paymentMethod": "COD",
  "address": {
    "street": "123 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Test Market"
  },
  "deliverySlot": {
    "date": "2025-10-10",
    "timeSlot": "Morning (9 AM - 12 PM)"
  }
}
```

## Expected Email Content

### Buyer Email Should Include:
- ✅ Order number
- ✅ Order date
- ✅ Status: "Order Confirmed"
- ✅ Payment method
- ✅ Product table with items
- ✅ Total amount
- ✅ Delivery address
- ✅ Estimated delivery date
- ✅ Seller name

### Seller Email Should Include:
- ✅ Order number
- ✅ Order date
- ✅ Customer name
- ✅ Delivery address
- ✅ Product table with items
- ✅ Total amount
- ✅ Action required notice

## Troubleshooting

### "Email service not configured" Warning
- **Expected in development** without email setup
- Emails will log to console instead
- Order creation still works normally

### TypeScript Errors
If you see nodemailer type errors:
```bash
cd packages/api
pnpm install
```

### Emails Not Received
1. Check spam folder
2. Verify EMAIL_USER and EMAIL_PASS in .env
3. Ensure users have email addresses in database
4. Check console for error messages

### Gmail "Less Secure App" Error
- Use App Password (not regular password)
- Enable 2-Factor Authentication first
- Generate new app password if needed

## Next Steps

After testing:
1. ✅ Verify email templates look good
2. ✅ Customize branding if needed
3. ✅ Set up production email service (SendGrid, AWS SES, etc.)
4. ✅ Configure SPF/DKIM for better deliverability
5. ✅ Add email tracking/analytics if desired

## Production Deployment

Before going to production:
1. Use professional email service (not Gmail)
2. Configure proper domain authentication
3. Set up email monitoring
4. Test with real user data
5. Monitor delivery rates

---

**Need Help?** Check `EMAIL_CONFIRMATION_GUIDE.md` for detailed documentation.
