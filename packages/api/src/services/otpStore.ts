// Simple in-memory OTP store for development
// In production, use Redis or database

interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
}

class OTPStore {
  private store = new Map<string, OTPData>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOTP(phone: string): Promise<string> {
    const code = this.generateOTP();
    const expiresAt = Date.now() + this.EXPIRY_TIME;
    
    this.store.set(phone, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired OTPs periodically
    this.cleanup();
    
    return code;
  }

  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const otpData = this.store.get(phone);
    
    if (!otpData) {
      return false;
    }

    // Check if expired
    if (Date.now() > otpData.expiresAt) {
      this.store.delete(phone);
      return false;
    }

    // Check attempts
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(phone);
      return false;
    }

    // Increment attempts
    otpData.attempts++;

    // Check code
    if (otpData.code === code) {
      this.store.delete(phone); // Remove after successful verification
      return true;
    }

    return false;
  }

  private cleanup() {
    const now = Date.now();
    for (const [phone, otpData] of this.store.entries()) {
      if (now > otpData.expiresAt) {
        this.store.delete(phone);
      }
    }
  }
}

export const otpStore = new OTPStore();
