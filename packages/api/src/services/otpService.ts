import { Twilio } from 'twilio';

interface OTPService {
  sendOTP(phone: string, code: string): Promise<boolean>;
}

class MockOTPService implements OTPService {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    console.log(`📱 Mock OTP sent to ${phone}: ${code}`);
    return true;
  }
}

class TwilioOTPService implements OTPService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async sendOTP(phone: string, code: string): Promise<boolean> {
    try {
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      const from = process.env.TWILIO_PHONE_NUMBER;
      const body = `Your Agri-Connect verification code is: ${code}. Valid for 10 minutes.`;

      const payload: any = {
        body,
        to: phone,
      };

      if (messagingServiceSid) {
        payload.messagingServiceSid = messagingServiceSid;
      } else if (from) {
        payload.from = from;
      } else {
        console.error('Twilio config error: provide TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER');
        return false;
      }

      const result = await this.client.messages.create(payload);
      console.log('Twilio message queued:', { sid: result.sid, status: result.status });
      return true;
    } catch (error) {
      console.error('Failed to send OTP via Twilio:',
        (error as any)?.message || error,
        (error as any)?.code ? { code: (error as any).code } : '',
        (error as any)?.moreInfo ? { moreInfo: (error as any).moreInfo } : ''
      );
      return false;
    }
  }
}

// Factory function to create the appropriate OTP service
export function createOTPService(): OTPService {
  const env = process.env.NODE_ENV || 'development';
  const provider = process.env.OTP_PROVIDER || 'mock';

  // Safety: always use mock in non-production to avoid accidental SMS charges
  if (env !== 'production') {
    console.log(`[OTP] Using MockOTPService (env=${env}, provider env=${provider})`);
    return new MockOTPService();
  }

  // In production, honor configured provider
  switch (provider) {
    case 'twilio':
      console.log('[OTP] Using TwilioOTPService (production)');
      return new TwilioOTPService();
    case 'mock':
    default:
      console.log('[OTP] Using MockOTPService (production)');
      return new MockOTPService();
  }
}

export const otpService = createOTPService();
