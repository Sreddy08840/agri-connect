import { redis } from '../config/redis';

export interface OTPProvider {
  sendOTP(phone: string, code: string): Promise<boolean>;
}

class MockOTPProvider implements OTPProvider {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    console.log(`[MOCK OTP] Sending OTP to ${phone}: ${code}`);
    return true;
  }
}

class TwilioOTPProvider implements OTPProvider {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    // TODO: Implement Twilio SMS
    console.log(`[TWILIO OTP] Sending OTP to ${phone}: ${code}`);
    return true;
  }
}

const getOTPProvider = (): OTPProvider => {
  const provider = process.env.OTP_PROVIDER || 'mock';
  
  switch (provider) {
    case 'twilio':
      return new TwilioOTPProvider();
    case 'mock':
    default:
      return new MockOTPProvider();
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (phone: string, code: string): Promise<void> => {
  const key = `otp:${phone}`;
  await redis.setex(key, 300, code); // 5 minutes expiry
};

export const verifyOTP = async (phone: string, code: string): Promise<boolean> => {
  const key = `otp:${phone}`;
  const storedCode = await redis.get(key);
  
  if (!storedCode) {
    return false;
  }
  
  const isValid = storedCode === code;
  
  if (isValid) {
    await redis.del(key); // Remove OTP after successful verification
  }
  
  return isValid;
};

export const sendOTP = async (phone: string): Promise<{ success: boolean; code?: string }> => {
  try {
    const code = generateOTP();
    await storeOTP(phone, code);
    
    const provider = getOTPProvider();
    const sent = await provider.sendOTP(phone, code);
    
    if (sent) {
      return { success: true, code: process.env.NODE_ENV === 'development' ? code : undefined };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false };
  }
};
