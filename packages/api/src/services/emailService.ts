import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OrderDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  farmerName: string;
  farmerEmail: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery: string;
  paymentMethod: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private isConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'agriconnect28@gmail.com';
    this.initialize();
  }

  private initialize() {
    try {
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT;
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      // If email credentials are not configured, use a test account for development
      if (!emailHost || !emailUser || !emailPass) {
        console.warn('⚠️  Email service not configured. Emails will be logged to console only.');
        this.isConfigured = false;
        return;
      }

      const config: EmailConfig = {
        host: emailHost,
        port: parseInt(emailPort || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send order confirmation email to buyer
   */
  async sendBuyerConfirmation(orderDetails: OrderDetails): Promise<void> {
    const subject = `Order Confirmation - ${orderDetails.orderNumber}`;
    const html = this.generateBuyerEmailTemplate(orderDetails);

    await this.sendEmail(orderDetails.customerEmail, subject, html);
  }

  /**
   * Send order notification email to seller
   */
  async sendSellerNotification(orderDetails: OrderDetails): Promise<void> {
    const subject = `New Order Received - ${orderDetails.orderNumber}`;
    const html = this.generateSellerEmailTemplate(orderDetails);

    await this.sendEmail(orderDetails.farmerEmail, subject, html);
  }

  /**
   * Send email with error handling
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('\n📧 Email (Console Mode):');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', html.substring(0, 200) + '...');
        return;
      }

      const mailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Don't throw error to prevent order creation from failing
    }
  }

  /**
   * Generate HTML email template for buyer
   */
  private generateBuyerEmailTemplate(order: OrderDetails): string {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your order</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #10b981; margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Order Confirmed</span></p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #10b981; margin-top: 0;">Items Ordered</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #10b981;">Product</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #10b981;">Quantity</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #10b981;">Price</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #10b981;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #10b981; margin-top: 0;">Delivery Information</h2>
              <p><strong>Delivery Address:</strong><br>${order.deliveryAddress}</p>
              <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
              <p><strong>Seller:</strong> ${order.farmerName}</p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>📦 What's Next?</strong></p>
              <p style="margin: 10px 0 0 0;">Your order is being prepared by the seller. You'll receive updates via email and SMS as your order progresses.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Need help? Contact us at support@agri-connect.com</p>
              <p style="color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} Agri-Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    try {
      const subject = 'Your Agri-Connect Verification Code';
      const html = this.generateOTPEmailTemplate(otp, name);

      if (!this.isConfigured || !this.transporter) {
        console.log('\n📧 OTP Email (Console Mode):');
        console.log('To:', email);
        console.log('Subject:', subject);
        console.log('OTP Code:', otp);
        return true;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  private generateOTPEmailTemplate(otp: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🌾 Agri-Connect</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Verification Code</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              ${name ? `<p style="font-size: 16px; margin-bottom: 16px;">Hello ${name},</p>` : ''}
              <p style="font-size: 16px; margin-bottom: 16px;">Your verification code for Agri-Connect is:</p>
              
              <div style="background: #f3f4f6; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
              <p style="font-size: 14px; color: #6b7280;">If you didn't request this code, please ignore this email.</p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px;"><strong>🔒 Security Tip:</strong> Never share this code with anyone. Agri-Connect will never ask for your verification code.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Need help? Contact us at support@agri-connect.com</p>
              <p style="color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} Agri-Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML email template for seller
   */
  private generateSellerEmailTemplate(order: OrderDetails): string {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">New Order Received! 🛒</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">You have a new order to fulfill</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #3b82f6; margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Order Confirmed</span></p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #3b82f6; margin-top: 0;">Customer Information</h2>
              <p><strong>Name:</strong> ${order.customerName}</p>
              <p><strong>Delivery Address:</strong><br>${order.deliveryAddress}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #3b82f6; margin-top: 0;">Items to Prepare</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3b82f6;">Product</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #3b82f6;">Quantity</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #3b82f6;">Price</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #3b82f6;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #3b82f6;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>⚡ Action Required</strong></p>
              <p style="margin: 10px 0 0 0;">Please log in to your dashboard to accept this order and begin preparation. The customer expects delivery by ${order.estimatedDelivery}.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at support@agri-connect.com</p>
              <p style="color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} Agri-Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
