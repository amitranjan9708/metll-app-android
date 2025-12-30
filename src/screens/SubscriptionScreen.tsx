import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanType = 'free' | 'premium' | 'pro';

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  gradient: string[];
  icon: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'Forever',
    description: 'Perfect for getting started',
    features: [
      '5 confessions per month',
      'Basic matching',
      'School & College search',
      'Limited live matching',
      'Standard support',
    ],
    gradient: ['#E8E8E8', '#F5F5F5'],
    icon: 'gift-outline',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'Most popular choice',
    features: [
      'Unlimited confessions',
      'Priority matching',
      'All search types',
      'Full live matching',
      'See who viewed you',
      'Priority support',
      'Ad-free experience',
    ],
    popular: true,
    gradient: theme.gradients.primary.colors as [string, string],
    icon: 'star',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99',
    period: 'per month',
    description: 'For serious matchmakers',
    features: [
      'Everything in Premium',
      'Advanced filters',
      'Read receipts',
      'Super likes',
      'Profile boost',
      '24/7 priority support',
      'Early access to features',
    ],
    gradient: theme.gradients.romantic.colors as [string, string],
    icon: 'diamond',
  },
];

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.planWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.popular && styles.planCardPopular,
        ]}
        onPress={onSelect}
        activeOpacity={0.9}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <LinearGradient
              colors={theme.gradients.primary.colors as [string, string]}
              style={styles.popularBadgeGradient}
            >
              <Text style={styles.popularBadgeText}>Most Popular</Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.planHeader}>
          <View
            style={[
              styles.planIconContainer,
              { backgroundColor: plan.gradient[0] + '20' },
            ]}
          >
            <Ionicons
              name={plan.icon as any}
              size={32}
              color={plan.gradient[0]}
            />
          </View>
          <View style={styles.planTitleContainer}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={plan.gradient[0]}
              />
            </View>
          )}
        </View>

        <View style={styles.planPricing}>
          <Text style={[styles.planPrice, { color: plan.gradient[0] }]}>
            {plan.price}
          </Text>
          <Text style={styles.planPeriod}>/{plan.period}</Text>
        </View>

        <View style={styles.planFeatures}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={plan.gradient[0]}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: PlanType) => {
    setLoading(true);
    try {
      // Mock subscription logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Success! 🎉',
        `You've subscribed to ${PLANS.find(p => p.id === planId)?.name} plan!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  return (
    <LinearGradient
      colors={theme.gradients.background.colors as [string, string, string]}
      style={styles.container}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Unlock all features and find your perfect match
        </Text>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={isSelected}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            );
          })}
        </View>

        {/* Subscribe Button */}
        <Button
          title={`Subscribe to ${selectedPlanData?.name}`}
          onPress={() => handleSubscribe(selectedPlan)}
          loading={loading}
          variant="primary"
          style={styles.subscribeButton}
          icon={
            <Ionicons
              name="diamond"
              size={20}
              color={theme.colors.white}
            />
          }
        />

        {/* Terms */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Subscription will auto-renew unless cancelled.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  headerTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  planWrapper: {
    marginBottom: theme.spacing.sm,
  },
  planCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    ...theme.shadows.lg,
  },
  planCardPopular: {
    borderColor: theme.colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  popularBadgeGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  popularBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    ...theme.typography.heading,
    fontSize: 24,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  planDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  selectedIndicator: {
    marginLeft: theme.spacing.sm,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.lg,
  },
  planPrice: {
    ...theme.typography.heading,
    fontSize: 32,
    fontWeight: '700',
  },
  planPeriod: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  planFeatures: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  subscribeButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  termsText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 18,
  },
});
