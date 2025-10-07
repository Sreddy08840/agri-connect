import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrackEventPayload {
  type: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'click';
  userId?: string | null;
  productId?: string;
  value?: number;
  meta?: Record<string, any>;
}

interface QueuedEvent extends TrackEventPayload {
  timestamp: number;
}

const EVENT_QUEUE_KEY = '@event_queue';
const MAX_QUEUE_SIZE = 50;

/**
 * Track user events by sending them to the API
 * Queues events if offline and flushes on reconnect
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    await api.post('/events', payload);
    // If successful, try to flush any queued events
    await flushEventQueue();
  } catch (err) {
    console.warn('trackEvent failed, queuing event', err);
    // Queue the event for later if API call fails
    await queueEvent(payload);
  }
}

/**
 * Queue an event for later sending
 */
async function queueEvent(payload: TrackEventPayload): Promise<void> {
  try {
    const queueJson = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
    const queue: QueuedEvent[] = queueJson ? JSON.parse(queueJson) : [];
    
    queue.push({
      ...payload,
      timestamp: Date.now(),
    });

    // Limit queue size to prevent excessive storage
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.shift(); // Remove oldest event
    }

    await AsyncStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to queue event', err);
  }
}

/**
 * Flush queued events to the API
 */
export async function flushEventQueue(): Promise<void> {
  try {
    const queueJson = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
    if (!queueJson) return;

    const queue: QueuedEvent[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    // Try to send all queued events
    const sendPromises = queue.map(event => {
      const { timestamp, ...payload } = event;
      return api.post('/events', payload);
    });

    await Promise.all(sendPromises);
    
    // Clear queue on success
    await AsyncStorage.removeItem(EVENT_QUEUE_KEY);
    console.log(`Flushed ${queue.length} queued events`);
  } catch (err) {
    console.warn('Failed to flush event queue', err);
    // Keep events in queue for next attempt
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
