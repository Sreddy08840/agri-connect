import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'agri-connect25@gmail.com';
const ADMIN_EMAIL_PASSWORD = process.env.ADMIN_EMAIL_PASSWORD || '';

// Create reusable transporter
const createTransporter = () => {
  // For development, use ethereal email or console logging
  if (process.env.NODE_ENV === 'development' && !ADMIN_EMAIL_PASSWORD) {
    console.log('⚠️  Email service running in development mode without credentials');
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ADMIN_EMAIL,
        pass: ADMIN_EMAIL_PASSWORD
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

export const sendVerificationEmail = async (
  to: string,
  userName: string,
  verificationUrl: string
): Promise<boolean> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `Agri-Connect <${ADMIN_EMAIL}>`,
    to,
    subject: 'Verify Your Email Address - Agri-Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌾 Agri-Connect</h1>
            <p>Connecting Farmers with Customers</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for joining Agri-Connect. Please verify your email address to complete your registration and secure your account.</p>
            
            <p>Click the button below to verify your email:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with Agri-Connect, please ignore this email.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Agri-Connect. All rights reserved.</p>
              <p>This email was sent from ${ADMIN_EMAIL}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (!transporter) {
      // In development without credentials, just log
      console.log('\n📧 Email Verification (Development Mode)');
      console.log('To:', to);
      console.log('Subject:', mailOptions.subject);
      console.log('Verification URL:', verificationUrl);
      console.log('\n');
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  userName: string,
  resetUrl: string
): Promise<boolean> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `Agri-Connect <${ADMIN_EMAIL}>`,
    to,
    subject: 'Reset Your Password - Agri-Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
            <p>Agri-Connect Security</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Agri-Connect. All rights reserved.</p>
              <p>This email was sent from ${ADMIN_EMAIL}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (!transporter) {
      console.log('\n📧 Password Reset Email (Development Mode)');
      console.log('To:', to);
      console.log('Subject:', mailOptions.subject);
      console.log('Reset URL:', resetUrl);
      console.log('\n');
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
};
