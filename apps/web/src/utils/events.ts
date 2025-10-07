import { api } from '../lib/api';

export interface TrackEventPayload {
  type: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'click';
  userId?: string | null;
  productId?: string;
  value?: number;
  meta?: Record<string, any>;
}

/**
 * Track user events by sending them to the API
 * Fails silently to avoid disrupting user experience
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    await api.post('/events', payload);
  } catch (err) {
    console.warn('trackEvent failed', err);
  }
}

/**
 * Track product view event
 */
export function trackProductView(productId: string, userId?: string | null): void {
  trackEvent({
    type: 'view',
    userId,
    productId,
  });
}

/**
 * Track add to cart event
 */
export function trackAddToCart(
  productId: string,
  userId?: string | null,
  value?: number,
  meta?: Record<string, any>
): void {
  trackEvent({
    type: 'add_to_cart',
    userId,
    productId,
    value,
    meta,
  });
}

/**
 * Track purchase event
 */
export function trackPurchase(
  userId?: string | null,
  value?: number,
  meta?: Record<string, any>
): void {
  trackEvent({
    type: 'purchase',
    userId,
    value,
    meta,
  });
}
