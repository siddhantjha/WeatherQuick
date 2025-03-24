import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import {
  subscriptionService,
  SubscriptionTier,
  SubscriptionPeriod,
  SubscriptionStatus,
  SUBSCRIPTION_PRICING,
  SUBSCRIPTION_LIMITS,
} from '../services/SubscriptionService';
import { colors } from '../styles/colors';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>(
    SubscriptionPeriod.MONTHLY
  );

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      setUserSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to purchase a subscription');
      return;
    }

    setPurchasing(true);
    try {
      const success = await subscriptionService.purchaseSubscription(selectedPeriod);
      if (success) {
        Alert.alert(
          'Purchase Successful',
          'Thank you for subscribing to WeatherQuick Premium!',
          [
            {
              text: 'OK',
              onPress: () => {
                loadSubscriptionData();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', 'There was an error processing your purchase.');
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Purchase Failed', 'There was an error processing your purchase.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancel = async () => {
    if (!userSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You will continue to have premium access until the end of your billing period.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await subscriptionService.cancelSubscription();
              if (success) {
                Alert.alert(
                  'Subscription Cancelled',
                  'Your subscription has been cancelled. You will continue to have premium access until the end of your current billing period.'
                );
                loadSubscriptionData();
              } else {
                Alert.alert('Error', 'Failed to cancel subscription');
              }
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await subscriptionService.restorePurchases();
      if (success) {
        Alert.alert('Success', 'Your purchases have been restored successfully');
        loadSubscriptionData();
      } else {
        Alert.alert('Restore Failed', 'No previous purchases were found');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  const isPremium = userSubscription?.tier === SubscriptionTier.PREMIUM && 
                   userSubscription?.status === SubscriptionStatus.ACTIVE;

  const renderFeatureItem = (title: string, included: boolean) => (
    <View style={styles.featureItem}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle'}
        size={24}
        color={included ? colors.success : colors.textSecondary}
      />
      <Text style={styles.featureText}>{title}</Text>
    </View>
  );

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Subscription</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {isPremium ? (
          // Premium user view
          <View style={styles.subscriptionContainer}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={32} color={colors.white} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
            
            <Text style={styles.subscriptionTitle}>
              Your Premium Subscription
            </Text>
            
            <View style={styles.subscriptionInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>
                  {userSubscription.status === SubscriptionStatus.ACTIVE
                    ? 'Active'
                    : userSubscription.status === SubscriptionStatus.CANCELLED
                    ? 'Cancelled'
                    : 'Expired'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan:</Text>
                <Text style={styles.infoValue}>
                  {userSubscription.period === SubscriptionPeriod.MONTHLY
                    ? 'Monthly'
                    : 'Yearly'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Renews:</Text>
                <Text style={styles.infoValue}>
                  {userSubscription.autoRenew
                    ? formatDate(userSubscription.endDate)
                    : 'No auto-renewal'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End Date:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(userSubscription.endDate)}
                </Text>
              </View>
            </View>
            
            {userSubscription.status === SubscriptionStatus.ACTIVE && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Your Premium Benefits</Text>
              
              {renderFeatureItem('Unlimited saved locations', true)}
              {renderFeatureItem('Extended forecast history', true)}
              {renderFeatureItem('Detailed weather data', true)}
              {renderFeatureItem('Custom weather alerts', true)}
              {renderFeatureItem('Customizable themes', true)}
              {renderFeatureItem('No advertisements', true)}
            </View>
          </View>
        ) : (
          // Free user view - subscription offer
          <View style={styles.offerContainer}>
            <Image
              source={require('../../assets/premium-banner.png')}
              style={styles.offerImage}
              resizeMode="cover"
            />
            
            <Text style={styles.offerTitle}>
              Upgrade to Premium
            </Text>
            
            <Text style={styles.offerSubtitle}>
              Get the most out of WeatherQuick with Premium features
            </Text>
            
            <View style={styles.benefitsContainer}>
              {renderFeatureItem('Unlimited saved locations', true)}
              {renderFeatureItem('Extended forecast history', true)}
              {renderFeatureItem('Detailed weather data', true)}
              {renderFeatureItem('Custom weather alerts', true)}
              {renderFeatureItem('Customizable themes', true)}
              {renderFeatureItem('No advertisements', true)}
            </View>
            
            <View style={styles.comparisonContainer}>
              <View style={styles.planColumn}>
                <Text style={styles.planTitle}>Free</Text>
                <Text style={styles.planPrice}>$0</Text>
                
                {renderFeatureItem('Limited to 3 locations', false)}
                {renderFeatureItem('7-day forecast only', false)}
                {renderFeatureItem('Basic weather data', true)}
                {renderFeatureItem('Standard alerts only', false)}
                {renderFeatureItem('Default theme only', false)}
                {renderFeatureItem('Contains ads', false)}
              </View>
              
              <View style={[styles.planColumn, styles.premiumColumn]}>
                <Text style={styles.planTitle}>Premium</Text>
                <Text style={styles.planPrice}>
                  {SUBSCRIPTION_PRICING[selectedPeriod].displayPrice}
                  <Text style={styles.planPeriod}>
                    /{selectedPeriod === SubscriptionPeriod.MONTHLY ? 'month' : 'year'}
                  </Text>
                </Text>
                
                {renderFeatureItem('Unlimited locations', true)}
                {renderFeatureItem('30-day forecast history', true)}
                {renderFeatureItem('Detailed weather data', true)}
                {renderFeatureItem('Custom alert settings', true)}
                {renderFeatureItem('Multiple themes', true)}
                {renderFeatureItem('Ad-free experience', true)}
              </View>
            </View>
            
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  selectedPeriod === SubscriptionPeriod.MONTHLY && styles.periodOptionSelected,
                ]}
                onPress={() => setSelectedPeriod(SubscriptionPeriod.MONTHLY)}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    selectedPeriod === SubscriptionPeriod.MONTHLY && styles.periodOptionTextSelected,
                  ]}
                >
                  Monthly
                </Text>
                <Text
                  style={[
                    styles.periodOptionPrice,
                    selectedPeriod === SubscriptionPeriod.MONTHLY && styles.periodOptionTextSelected,
                  ]}
                >
                  {SUBSCRIPTION_PRICING[SubscriptionPeriod.MONTHLY].displayPrice}/month
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  selectedPeriod === SubscriptionPeriod.YEARLY && styles.periodOptionSelected,
                ]}
                onPress={() => setSelectedPeriod(SubscriptionPeriod.YEARLY)}
              >
                <View style={styles.periodYearlyHeader}>
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === SubscriptionPeriod.YEARLY && styles.periodOptionTextSelected,
                    ]}
                  >
                    Yearly
                  </Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>Save 30%</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.periodOptionPrice,
                    selectedPeriod === SubscriptionPeriod.YEARLY && styles.periodOptionTextSelected,
                  ]}
                >
                  {SUBSCRIPTION_PRICING[SubscriptionPeriod.YEARLY].displayPrice}/year
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.subscribeButton, purchasing && styles.buttonDisabled]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe Now
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.restoreButtonText}>
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Your subscription will automatically renew unless turned off at least 24
              hours before the end of the current period. Manage your subscriptions in
              your account settings.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  offerContainer: {
    padding: 16,
  },
  offerImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  offerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  comparisonContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  planColumn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
  },
  premiumColumn: {
    backgroundColor: colors.primaryLight,
    marginLeft: 8,
    marginRight: 0,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  periodOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  periodOptionSelected: {
    backgroundColor: colors.primary,
  },
  periodOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  periodOptionTextSelected: {
    color: colors.white,
  },
  periodOptionPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  periodYearlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsBadge: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  savingsBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  subscriptionContainer: {
    padding: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  subscriptionInfo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubscriptionScreen; 