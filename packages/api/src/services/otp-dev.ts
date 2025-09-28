// Development-friendly OTP service
const otpStore = new Map<string, { code: string; expires: number }>();

export const generateOTP = (): string => {
  // For development, use a fixed code that's easy to remember
  return '123456';
};

export const storeOTP = async (phone: string, code: string): Promise<void> => {
  const expires = Date.now() + 600000; // 10 minutes (longer for development)
  otpStore.set(phone, { code, expires });
  console.log(`[OTP] Stored OTP for ${phone}: ${code} (expires in 10 minutes)`);
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
  
  // Accept both the stored code and the fixed development code
  const isValid = stored.code === code || code === '123456';
  console.log(`[OTP] Verification for ${phone}: ${isValid ? 'SUCCESS' : 'FAILED'} (entered: ${code}, stored: ${stored.code})`);
  
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
    
    return { success: true, code: code };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false };
  }
};
