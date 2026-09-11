import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store';
import { profileService } from '../services/api';
import ReferralModal from './ReferralModal';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface ProPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  highlightFeature?: string;
}

const PRO_FEATURES = [
  {
    icon: '⚡',
    title: 'Unlimited Workplaces',
    desc: 'Track 3+ restaurants, bars, or gig jobs simultaneously with custom hourly wages & tip-out rates.',
  },
  {
    icon: '📄',
    title: '1-Click CSV & Tax Reports',
    desc: 'Instant IRS-ready spreadsheet export of all your shifts, hours, cash tips, credit tips, and tip-outs.',
  },
  {
    icon: '🛡️',
    title: '2026 "No Tax on Tips" Calculator',
    desc: 'Automatic deduction estimation for the upcoming federal tip tax exemption legislation.',
  },
  {
    icon: '🎯',
    title: 'Custom Earnings Goals',
    desc: 'Set custom weekly and pay-period earnings targets with live progress tracking & alerts.',
  },
  {
    icon: '🚫',
    title: '100% Ad-Free Experience',
    desc: 'Fast, clutter-free shift tracking with zero banner or interstitial ads.',
  },
];

export default function ProPaywallModal({
  visible,
  onClose,
  onSuccess,
  highlightFeature,
}: ProPaywallModalProps) {
  const { session, profile, setProfile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const isAlreadyPro = profile?.subscription_tier === 'pro';

  const handleSubscribe = async () => {
    if (!session?.user?.id) return;
    setIsProcessing(true);

    try {
      // Activate Pro in Supabase database
      const { data, error } = await profileService.updateProfile(session.user.id, {
        subscription_tier: 'pro',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else if (data) {
        setProfile(data);
        if (Platform.OS === 'web') {
          window.alert('🎉 Welcome to TipStack PRO! All Pro features are now unlocked.');
        } else {
          Alert.alert('🎉 Welcome to TipStack PRO!', 'All Pro features have been unlocked for your account.');
        }
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Subscription Error', e.message || 'Could not process subscription.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeForTesting = async () => {
    if (!session?.user?.id) return;
    setIsProcessing(true);
    const { data } = await profileService.updateProfile(session.user.id, {
      subscription_tier: 'free',
    });
    if (data) {
      setProfile(data);
    }
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header Gradient */}
            <LinearGradient colors={COLORS.gradientGold} style={styles.heroHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>TipStack PRO ⭐</Text>
              <Text style={styles.heroSubtitle}>
                {highlightFeature ? `Unlock ${highlightFeature} & all Pro tools` : 'Earn it. Track it. Stack it.'}
              </Text>
            </LinearGradient>

            {/* Plan Selector */}
            <View style={styles.planContainer}>
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.8}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 45%</Text>
                </View>
                <View style={styles.planRadio}>
                  {selectedPlan === 'annual' && <View style={styles.planRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.planName}>Annual Pro Pass</Text>
                    <View style={styles.trialPill}>
                      <Text style={styles.trialPillText}>14 DAYS FREE</Text>
                    </View>
                  </View>
                  <Text style={styles.planTrial}>$1.66/mo billed yearly ($19.99)</Text>
                </View>
                <Text style={styles.planPrice}>$19.99<Text style={styles.planPeriod}>/yr</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planRadio}>
                  {selectedPlan === 'monthly' && <View style={styles.planRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Monthly Pro Pass</Text>
                  <Text style={styles.planTrial}>Flexible · Cancel anytime</Text>
                </View>
                <Text style={styles.planPrice}>$2.99<Text style={styles.planPeriod}>/mo</Text></Text>
              </TouchableOpacity>
            </View>

            {/* Referral Reward Banner */}
            <TouchableOpacity
              style={styles.referralCardBanner}
              onPress={() => setIsReferralOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 24 }}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralBannerTitle}>Refer a Fellow TipStacker</Text>
                <Text style={styles.referralBannerSub}>Get 1 Month of Pro completely FREE for each friend who subscribes!</Text>
              </View>
              <Text style={{ fontSize: 16, color: '#FFD166', fontWeight: '900' }}>→</Text>
            </TouchableOpacity>

            {/* Features List */}
            <View style={styles.featuresList}>
              <Text style={styles.featuresHeader}>EVERYTHING IN PRO INCLUDES:</Text>
              {PRO_FEATURES.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{feat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{feat.title}</Text>
                    <Text style={styles.featureDesc}>{feat.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[styles.ctaButton, isProcessing && { opacity: 0.7 }]}
              onPress={handleSubscribe}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={styles.ctaText}>
                  {isAlreadyPro
                    ? 'You are on Pro ⭐'
                    : selectedPlan === 'annual'
                    ? 'Start 14-Day Free Trial 🚀'
                    : 'Subscribe Monthly ($2.99/mo) 🚀'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              {selectedPlan === 'annual'
                ? '14-day free trial, then $19.99/yr. Cancel anytime in Settings before trial ends.'
                : '$2.99/month, cancel anytime in Settings.'}
            </Text>

            {/* Dev toggle to revert to Free tier for testing */}
            {isAlreadyPro && (
              <TouchableOpacity onPress={handleDowngradeForTesting} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>[Dev: Revert account to Free tier]</Text>
              </TouchableOpacity>
            )}

            {/* Legal */}
            <View style={styles.legalRow}>
              <TouchableOpacity onPress={() => Linking.openURL('https://tipstack.app/terms')}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://tipstack.app/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.sm }}>
              © {new Date().getFullYear()} Johnson Enterprise Tech, LLC. All rights reserved.
            </Text>

            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Child Referral Modal */}
      <ReferralModal visible={isReferralOpen} onClose={() => setIsReferralOpen(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  heroHeader: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glow,
  },
  heroLogo: { width: 72, height: 72, borderRadius: RADIUS.md, marginBottom: SPACING.xs },
  heroTitle: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: '#0D0F14' },
  heroSubtitle: { fontSize: FONT_SIZES.xs, color: '#0D0F14', opacity: 0.85, textAlign: 'center', marginTop: 2 },
  planContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    gap: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceElevated,
  },
  saveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: RADIUS.sm,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D0F14',
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  planName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  planTrial: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  planPrice: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: COLORS.textPrimary },
  planPeriod: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: COLORS.textSecondary },
  trialPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  trialPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0F14',
  },
  referralCardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#FFD166' + '18',
    borderWidth: 1.5,
    borderColor: '#FFD166' + '66',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  referralBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD166',
    marginBottom: 2,
  },
  referralBannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 15,
  },
  featuresList: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  featuresHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  featureIcon: { fontSize: 20, marginTop: 2 },
  featureTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 15, marginTop: 2 },
  ctaButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.glow,
  },
  ctaText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#0D0F14',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  legalLink: { fontSize: 11, color: COLORS.primary, textDecorationLine: 'underline' },
  legalDot: { fontSize: 11, color: COLORS.textMuted },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  closeBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
