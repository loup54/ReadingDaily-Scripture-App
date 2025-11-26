/**
 * Subscription Cancellation Service
 *
 * Handles server-side subscription cancellation through Firebase Cloud Function
 * Communicates with backend to:
 * - Cancel active subscriptions with payment providers
 * - Stop auto-renewal
 * - Log cancellation reason and analytics
 * - Update user subscription status
 */

import { auth } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

export interface CancellationRequest {
  userId: string;
  subscriptionId: string;
  reason?: 'user_requested' | 'payment_failed' | 'refund' | 'admin_action' | 'other';
  feedback?: string;
}

export interface CancellationResponse {
  success: boolean;
  message: string;
  cancellationDate?: number; // Unix timestamp
  refundStatus?: 'pending' | 'approved' | 'denied';
  refundAmount?: number;
  error?: string;
}

class SubscriptionCancellationServiceClass {
  /**
   * Cancel user's active subscription
   * Calls backend Firebase Cloud Function to handle payment provider integration
   */
  async cancelSubscription(request: CancellationRequest): Promise<CancellationResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
          error: 'AUTH_ERROR',
        };
      }

      // Get ID token for backend authentication
      const idToken = await user.getIdToken();

      // Call Firebase Cloud Function
      const cancelSubscriptionFunction = httpsCallable<
        CancellationRequest & { idToken: string },
        CancellationResponse
      >(functions, 'cancelSubscription');

      const response = await cancelSubscriptionFunction({
        ...request,
        userId: user.uid,
        idToken,
      });

      console.log('[SubscriptionCancellationService] Cancellation response:', response.data);

      return response.data;
    } catch (error) {
      console.error('[SubscriptionCancellationService] Cancellation error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'Failed to cancel subscription',
        error: errorMessage,
      };
    }
  }

  /**
   * Get cancellation status for a subscription
   */
  async getCancellationStatus(subscriptionId: string): Promise<{
    isCancelled: boolean;
    cancellationDate?: number;
    cancellationReason?: string;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();

      const getCancellationStatusFunction = httpsCallable<
        { subscriptionId: string; idToken: string },
        { isCancelled: boolean; cancellationDate?: number; cancellationReason?: string }
      >(functions, 'getCancellationStatus');

      const response = await getCancellationStatusFunction({
        subscriptionId,
        idToken,
      });

      return response.data;
    } catch (error) {
      console.error('[SubscriptionCancellationService] Error getting cancellation status:', error);
      throw error;
    }
  }

  /**
   * Request a refund for a cancelled subscription
   */
  async requestRefund(subscriptionId: string, reason: string): Promise<{
    refundId: string;
    status: 'pending' | 'approved' | 'denied';
    amount: number;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();

      const requestRefundFunction = httpsCallable<
        { subscriptionId: string; reason: string; idToken: string },
        { refundId: string; status: 'pending' | 'approved' | 'denied'; amount: number }
      >(functions, 'requestRefund');

      const response = await requestRefundFunction({
        subscriptionId,
        reason,
        idToken,
      });

      console.log('[SubscriptionCancellationService] Refund requested:', response.data);

      return response.data;
    } catch (error) {
      console.error('[SubscriptionCancellationService] Error requesting refund:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionCancellationService = new SubscriptionCancellationServiceClass();
