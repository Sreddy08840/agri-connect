export interface JWTPayload {
  userId: string;
  role: 'CUSTOMER' | 'FARMER' | 'ADMIN';
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
    name: string;
    phone: string;
    verified: boolean;
  };
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  unit: string;
  qualityGrade?: string;
  stockQty: number;
  minOrderQty: number;
  categoryId: string;
  images?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    qty: number;
  }>;
  paymentMethod: 'ONLINE' | 'COD';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  deliverySlot?: {
    date: string;
    timeSlot: string;
  };
  voucherCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'ACCEPTED' | 'REJECTED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  reason?: string;
}
