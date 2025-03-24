import { Platform } from 'react-native';
import { supabase } from '../api/supabase';
import { SUBSCRIPTION_KEY } from '../api/environment';

// Product IDs for different platforms
export const SUBSCRIPTION_PRODUCTS = {
  monthly: Platform.select({
    ios: 'com.weatherquick.premium.monthly',
    android: 'com.weatherquick.premium.monthly',
  }) || 'com.weatherquick.premium.monthly',
  yearly: Platform.select({
    ios: 'com.weatherquick.premium.yearly',
    android: 'com.weatherquick.premium.yearly',
  }) || 'com.weatherquick.premium.yearly',
};

// Subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

// Subscription periods
export enum SubscriptionPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Subscription features and limits
export const SUBSCRIPTION_LIMITS = {
  [SubscriptionTier.FREE]: {
    maxLocations: 3,
    extendedForecast: false,
    detailedWeatherData: false,
    customAlerts: false,
    customThemes: false,
    widgets: false,
    ads: true,
  },
  [SubscriptionTier.PREMIUM]: {
    maxLocations: Infinity,
    extendedForecast: true,
    detailedWeatherData: true,
    customAlerts: true,
    customThemes: true,
    widgets: true,
    ads: false,
  },
};

// Subscription pricing (for display purposes)
export const SUBSCRIPTION_PRICING = {
  [SubscriptionPeriod.MONTHLY]: {
    price: 2.99,
    currency: 'USD',
    displayPrice: '$2.99',
  },
  [SubscriptionPeriod.YEARLY]: {
    price: 24.99,
    currency: 'USD',
    displayPrice: '$24.99',
  },
};

// Subscription interface
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  period?: SubscriptionPeriod;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  receiptData?: string;
  platform: 'ios' | 'android' | 'web';
}

// Mock implementation for demo purposes
// In a real app, you would integrate with the app stores' subscription APIs
class SubscriptionService {
  private currentSubscription: Subscription | null = null;

  constructor() {
    // Initialize the service
    this.initializeSubscription();
  }

  // Initialize subscription from local storage or fetch from server
  private async initializeSubscription() {
    try {
      if (!supabase.auth.getUser()) {
        this.currentSubscription = null;
        return;
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        this.currentSubscription = null;
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No subscription found, user is on free tier
        this.currentSubscription = null;
        return;
      }

      // Convert database record to Subscription object
      this.currentSubscription = {
        id: data.id,
        userId: data.user_id,
        tier: data.tier as SubscriptionTier,
        period: data.period as SubscriptionPeriod,
        status: data.status as SubscriptionStatus,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        autoRenew: data.auto_renew,
        receiptData: data.receipt_data,
        platform: data.platform as 'ios' | 'android' | 'web',
      };
    } catch (error) {
      console.error('Error initializing subscription:', error);
      this.currentSubscription = null;
    }
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<Subscription | null> {
    // If we haven't loaded it yet, initialize
    if (this.currentSubscription === undefined) {
      await this.initializeSubscription();
    }
    return this.currentSubscription;
  }

  // Check if user is premium
  async isPremium(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    return (
      subscription !== null &&
      subscription.tier === SubscriptionTier.PREMIUM &&
      subscription.status === SubscriptionStatus.ACTIVE
    );
  }

  // Get subscription tier
  async getSubscriptionTier(): Promise<SubscriptionTier> {
    const isPremium = await this.isPremium();
    return isPremium ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE;
  }

  // Get subscription limits
  async getSubscriptionLimits(): Promise<typeof SUBSCRIPTION_LIMITS[SubscriptionTier]> {
    const tier = await this.getSubscriptionTier();
    return SUBSCRIPTION_LIMITS[tier];
  }

  // Start premium subscription purchase flow
  async purchaseSubscription(period: SubscriptionPeriod): Promise<boolean> {
    // In a real app, you'd integrate with in-app purchase API here
    // For demo purposes, we'll just simulate a successful purchase
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Simulate receipt data
      const mockReceiptData = {
        productId: period === SubscriptionPeriod.MONTHLY 
          ? SUBSCRIPTION_PRODUCTS.monthly 
          : SUBSCRIPTION_PRODUCTS.yearly,
        transactionId: `mock-transaction-${Date.now()}`,
        purchaseDate: new Date().toISOString(),
      };

      // Calculate subscription end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (period === SubscriptionPeriod.MONTHLY) {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Add subscription to database
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.data.user.id,
          tier: SubscriptionTier.PREMIUM,
          period: period,
          status: SubscriptionStatus.ACTIVE,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
          receipt_data: JSON.stringify(mockReceiptData),
          platform: Platform.OS as 'ios' | 'android',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update current subscription
      this.currentSubscription = {
        id: data.id,
        userId: data.user_id,
        tier: data.tier as SubscriptionTier,
        period: data.period as SubscriptionPeriod,
        status: data.status as SubscriptionStatus,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        autoRenew: data.auto_renew,
        receiptData: data.receipt_data,
        platform: data.platform as 'ios' | 'android' | 'web',
      };

      // Update user profile to mark as premium
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', user.data.user.id);

      return true;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<boolean> {
    // In a real app, you'd integrate with in-app purchase API here
    try {
      if (!this.currentSubscription) {
        throw new Error('No active subscription to cancel');
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Update subscription in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: SubscriptionStatus.CANCELLED,
          auto_renew: false,
        })
        .eq('id', this.currentSubscription.id);

      if (error) {
        throw error;
      }

      // Update current subscription
      if (this.currentSubscription) {
        this.currentSubscription.status = SubscriptionStatus.CANCELLED;
        this.currentSubscription.autoRenew = false;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<boolean> {
    // In a real app, you'd check with the app store for valid purchases
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // For demo, we'll just reload the current subscription
      await this.initializeSubscription();
      return this.currentSubscription !== null;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService(); 