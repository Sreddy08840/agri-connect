# Email Order Confirmation System

## Overview

The automated order confirmation system sends professional email notifications to both buyers and sellers when an order is successfully placed. The system uses Nodemailer for email delivery and includes beautifully formatted HTML templates.

## Features

✅ **Automated Email Notifications**
- Buyer receives order confirmation with full details
- Seller receives new order notification
- Emails sent asynchronously (non-blocking)

✅ **Order Status Update**
- Orders automatically set to "CONFIRMED" status upon creation
- Status included in Prisma schema validation

✅ **Professional Email Templates**
- Responsive HTML design
- Order details table with itemized breakdown
- Delivery information and estimated dates
- Branded styling with gradient headers

✅ **Comprehensive Order Information**
- Product name, quantity, unit price, and total
- Total amount with currency formatting
- Delivery address (formatted from JSON)
- Estimated delivery date (4 business days)
- Payment method
- Order number for tracking

## Implementation Details

### 1. Email Service (`packages/api/src/services/emailService.ts`)

The email service is a singleton class that handles:
- SMTP configuration via environment variables
- Email template generation (buyer & seller)
- Error handling and fallback to console logging
- Asynchronous email sending

**Key Methods:**
- `sendBuyerConfirmation(orderDetails)` - Sends confirmation to buyer
- `sendSellerNotification(orderDetails)` - Notifies seller of new order
- `generateBuyerEmailTemplate(order)` - Creates buyer email HTML
- `generateSellerEmailTemplate(order)` - Creates seller email HTML

### 2. Order Status Enhancement

**Updated Status Enum:**
```typescript
status: z.enum(['CONFIRMED', 'ACCEPTED', 'REJECTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
```

**Order Creation:**
- Default status changed from `'PLACED'` to `'CONFIRMED'`
- Status reflects that order confirmation emails have been sent

### 3. Integration in Order Route

**Location:** `packages/api/src/routes/orders.ts`

**Process Flow:**
1. Order is created in database with `CONFIRMED` status
2. Order items are created and linked
3. Customer and farmer details are fetched
4. Order details are formatted for email
5. Emails are sent asynchronously to both parties
6. Order response is returned immediately (non-blocking)

## Configuration

### Environment Variables

Add these to your `.env` file (see `.env.example` for reference):

```bash
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com          # SMTP server host
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_SECURE=false                 # true for SSL, false for TLS
EMAIL_USER=your-email@gmail.com    # SMTP username/email
EMAIL_PASS=your-app-password       # SMTP password or app-specific password
EMAIL_FROM=noreply@agri-connect.com # Sender email address
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account Settings → Security
   - Select "2-Step Verification"
   - Scroll to "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

3. **Configure Environment:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

### Production Email Services

For production, consider using:
- **SendGrid** - Reliable, scalable email API
- **AWS SES** - Cost-effective for high volume
- **Mailgun** - Developer-friendly API
- **Postmark** - Transactional email specialist

## Email Templates

### Buyer Confirmation Email

**Subject:** `Order Confirmation - ORD-1234567890`

**Content Includes:**
- Order confirmation header with success message
- Order details (number, date, status, payment method)
- Itemized product table with quantities and prices
- Total amount in INR
- Delivery address and estimated delivery date
- Seller information
- Next steps and support contact

**Design:**
- Green gradient header (#10b981 to #059669)
- Responsive layout (max-width: 600px)
- Professional typography
- Clear call-to-action sections

### Seller Notification Email

**Subject:** `New Order Received - ORD-1234567890`

**Content Includes:**
- New order notification header
- Order details and status
- Customer information and delivery address
- Items to prepare with quantities
- Total order value
- Action required notice
- Support contact information

**Design:**
- Blue gradient header (#3b82f6 to #2563eb)
- Responsive layout (max-width: 600px)
- Emphasis on action items
- Professional business styling

## Testing

### Development Mode (No Email Configuration)

If email environment variables are not set, the service will:
- Log a warning on initialization
- Print email details to console instead of sending
- Allow development without SMTP setup

**Console Output Example:**
```
⚠️  Email service not configured. Emails will be logged to console only.

📧 Email (Console Mode):
To: customer@example.com
Subject: Order Confirmation - ORD-1234567890
Body: <!DOCTYPE html>...
```

### Testing with Real Emails

1. **Configure Email Settings:**
   ```bash
   cp .env.example .env
   # Edit .env with your SMTP credentials
   ```

2. **Ensure User Emails Exist:**
   - Customer must have email in User table
   - Farmer must have email in User table
   - Emails are optional; service skips if missing

3. **Place Test Order:**
   ```bash
   # Start the API server
   pnpm --filter @agri-connect/api dev
   
   # Place an order via API or web interface
   # Check console for email sending status
   ```

4. **Verify Email Delivery:**
   - Check inbox for buyer confirmation
   - Check seller inbox for notification
   - Verify all order details are correct

## Error Handling

The email service includes robust error handling:

1. **Configuration Errors:**
   - Service initializes in console-only mode
   - Application continues without email functionality
   - Warning logged on startup

2. **Send Errors:**
   - Errors caught and logged
   - Order creation still succeeds
   - No impact on user experience

3. **Missing Email Addresses:**
   - Service checks for email existence
   - Skips sending if email is null/undefined
   - Logs appropriate message

## Order Status Flow

```
Order Created → CONFIRMED (Email Sent)
     ↓
ACCEPTED (Farmer accepts)
     ↓
PACKED (Farmer packs items)
     ↓
SHIPPED (Order dispatched)
     ↓
DELIVERED (Customer receives)

Alternative flows:
CONFIRMED → REJECTED (Farmer rejects)
CONFIRMED → CANCELLED (Customer cancels)
```

## API Response

When an order is created, the API returns:

```json
{
  "id": "clx...",
  "orderNumber": "ORD-1234567890",
  "customerId": "clx...",
  "farmerId": "clx...",
  "total": 1500.00,
  "status": "CONFIRMED",
  "paymentMethod": "COD",
  "addressSnapshot": "{\"street\":\"123 Main St\",...}",
  "deliverySlot": "{\"date\":\"2025-10-10\",...}",
  "createdAt": "2025-10-07T10:27:02.000Z",
  "updatedAt": "2025-10-07T10:27:02.000Z",
  "items": [
    {
      "id": "clx...",
      "productId": "clx...",
      "qty": 10,
      "unitPrice": 150.00,
      "product": {
        "name": "Organic Tomatoes",
        "images": "[\"https://...\"]"
      }
    }
  ]
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables:**
   ```bash
   echo $EMAIL_HOST
   echo $EMAIL_USER
   # Verify all email variables are set
   ```

2. **Check Console Logs:**
   ```
   ✅ Email service initialized successfully
   ✅ Email sent successfully: <message-id>
   ```

3. **Verify SMTP Credentials:**
   - Test credentials with email client
   - Check for typos in .env file
   - Verify app password (not regular password)

4. **Check Firewall/Network:**
   - Ensure port 587 is not blocked
   - Try port 465 with `EMAIL_SECURE=true`

### Emails Going to Spam

1. **Use Authenticated Domain:**
   - Configure SPF records
   - Set up DKIM signing
   - Add DMARC policy

2. **Use Professional Email Service:**
   - SendGrid, AWS SES, etc. have better deliverability
   - Avoid using personal Gmail for production

3. **Improve Email Content:**
   - Avoid spam trigger words
   - Include unsubscribe link (for marketing emails)
   - Use proper HTML structure

### Missing User Emails

If users don't have email addresses:
- Email sending is skipped gracefully
- Order creation still succeeds
- Consider making email required during registration

## Future Enhancements

Potential improvements to consider:

1. **Email Templates:**
   - Add company logo
   - Customize colors/branding
   - Support multiple languages
   - Add order tracking link

2. **Email Types:**
   - Order status updates
   - Shipping notifications
   - Delivery confirmation
   - Payment receipts

3. **Advanced Features:**
   - Email queue with retry logic (using BullMQ)
   - Email analytics and tracking
   - Unsubscribe management
   - Email preferences per user

4. **Testing:**
   - Unit tests for email service
   - Integration tests for order flow
   - Email template preview tool

## Dependencies

```json
{
  "nodemailer": "^7.0.9",
  "@types/nodemailer": "^6.4.14"
}
```

## Files Modified/Created

### Created:
- `packages/api/src/services/emailService.ts` - Email service implementation

### Modified:
- `packages/api/src/routes/orders.ts` - Added email integration
- `packages/api/.env.example` - Added email configuration
- `packages/api/package.json` - Added nodemailer types

## Support

For issues or questions:
- Check console logs for error messages
- Verify environment configuration
- Review email service initialization
- Contact: support@agri-connect.com

---

**Last Updated:** October 7, 2025  
**Version:** 1.0.0
