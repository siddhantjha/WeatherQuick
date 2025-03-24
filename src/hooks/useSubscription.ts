import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import { 
  subscriptionService, 
  SubscriptionTier,
  SubscriptionPeriod,
  SubscriptionStatus,
  SUBSCRIPTION_LIMITS,
} from '../services/SubscriptionService';

interface SubscriptionContext {
  isPremium: boolean;
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;
  subscriptionDetails: any | null;
  refreshSubscription: () => Promise<void>;
  purchaseSubscription: (period: SubscriptionPeriod) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getFeatureLimit: (featureKey: keyof typeof SUBSCRIPTION_LIMITS[SubscriptionTier.FREE]) => number;
}

const SubscriptionContext = createContext<SubscriptionContext>({
  isPremium: false,
  tier: SubscriptionTier.FREE,
  isLoading: true,
  error: null,
  subscriptionDetails: null,
  refreshSubscription: async () => {},
  purchaseSubscription: async () => false,
  cancelSubscription: async () => false,
  restorePurchases: async () => false,
  getFeatureLimit: () => 0,
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [tier, setTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      // Reset to free tier when logged out
      setIsPremium(false);
      setTier(SubscriptionTier.FREE);
      setSubscriptionDetails(null);
      setIsLoading(false);
    }
  }, [user]);

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      
      if (subscription) {
        setSubscriptionDetails(subscription);
        const premiumActive = 
          subscription.tier === SubscriptionTier.PREMIUM && 
          subscription.status === SubscriptionStatus.ACTIVE;
        
        setIsPremium(premiumActive);
        setTier(premiumActive ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE);
      } else {
        setIsPremium(false);
        setTier(SubscriptionTier.FREE);
        setSubscriptionDetails(null);
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError('Failed to load subscription details');
      setIsPremium(false);
      setTier(SubscriptionTier.FREE);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseSubscription = async (period: SubscriptionPeriod): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to purchase a subscription');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await subscriptionService.purchaseSubscription(period);
      if (success) {
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      setError('Failed to purchase subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !isPremium) return false;

    setIsLoading(true);
    try {
      const success = await subscriptionService.cancelSubscription();
      if (success) {
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to restore purchases');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await subscriptionService.restorePurchases();
      if (success) {
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error restoring purchases:', err);
      setError('Failed to restore purchases');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureLimit = (featureKey: keyof typeof SUBSCRIPTION_LIMITS[SubscriptionTier.FREE]): number => {
    const currentTier = tier;
    return SUBSCRIPTION_LIMITS[currentTier][featureKey];
  };

  const value = {
    isPremium,
    tier,
    isLoading,
    error,
    subscriptionDetails,
    refreshSubscription,
    purchaseSubscription,
    cancelSubscription,
    restorePurchases,
    getFeatureLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContext => {
  return useContext(SubscriptionContext);
}; 