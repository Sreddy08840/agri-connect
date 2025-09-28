import Razorpay from 'razorpay';

interface PaymentService {
  createOrder(amount: number, orderId: string): Promise<any>;
  verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean>;
}

class MockPaymentService implements PaymentService {
  async createOrder(amount: number, orderId: string): Promise<any> {
    console.log(`💳 Mock payment order created: ₹${amount} for order ${orderId}`);
    return {
      id: `mock_order_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      status: 'created',
    };
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
    console.log(`✅ Mock payment verified: ${paymentId} for order ${orderId}`);
    return true;
  }
}

class RazorpayPaymentService implements PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(amount: number, orderId: string): Promise<any> {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: orderId,
        payment_capture: true,
      });
      return order;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw new Error('Payment order creation failed');
    }
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Failed to verify Razorpay payment:', error);
      return false;
    }
  }
}

// Factory function to create the appropriate payment service
export function createPaymentService(): PaymentService {
  const provider = process.env.PAYMENTS_PROVIDER || 'mock';
  
  switch (provider) {
    case 'razorpay':
      return new RazorpayPaymentService();
    case 'mock':
    default:
      return new MockPaymentService();
  }
}

export const paymentService = createPaymentService();
