// Simple in-memory OTP store for development
const otpStore = new Map<string, { code: string; expires: number }>();

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (phone: string, code: string): Promise<void> => {
  const expires = Date.now() + 300000; // 5 minutes
  otpStore.set(phone, { code, expires });
  console.log(`[OTP] Stored OTP for ${phone}: ${code} (expires in 5 minutes)`);
};

export const verifyOTP = async (phone: string, code: string): Promise<boolean> => {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    console.log(`[OTP] No OTP found for ${phone}`);
    return false;
  }
  
  if (Date.now() > stored.expires) {
    console.log(`[OTP] OTP expired for ${phone}`);
    otpStore.delete(phone);
    return false;
  }
  
  const isValid = stored.code === code;
  console.log(`[OTP] Verification for ${phone}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  
  if (isValid) {
    otpStore.delete(phone);
  }
  
  return isValid;
};

export const sendOTP = async (phone: string): Promise<{ success: boolean; code?: string }> => {
  try {
    const code = generateOTP();
    await storeOTP(phone, code);
    
    console.log(`[MOCK OTP] Sending OTP to ${phone}: ${code}`);
    
    return { success: true, code: process.env.NODE_ENV === 'development' ? code : undefined };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false };
  }
};
