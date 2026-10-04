import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface FeatureTourModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const TOUR_SLIDES = [
  {
    icon: '⏱️',
    tag: 'CORE ENGINE',
    title: 'Live Shift Tracking & True $/hr',
    subtitle: 'Never guess how much you actually made. TipStack does the real math in real-time.',
    gradient: ['#00C9A7', '#009578'],
    highlights: [
      { label: 'Base Hourly Wage', desc: 'Adds your guaranteed base hourly pay automatically.' },
      { label: 'Cash & Credit Tips', desc: 'Instant separation with 1-tap fast entry.' },
      { label: 'Tip-Out Auto Deduction', desc: 'Deducts barback, busser, and kitchen cuts accurately.' },
      { label: 'True Take-Home $/hr', desc: 'Reveals your real net hourly rate before you clock out.' },
    ],
    proTip: '💡 Pro Tip: Set custom tip-out percentages for each workplace in Profile.',
  },
  {
    icon: '👑',
    tag: 'SCHEDULE INTELLIGENCE',
    title: 'Golden Shift™ Matrix & Calendar',
    subtitle: 'Pinpoint which shifts are money makers and which days are costing you time.',
    gradient: ['#FFD166', '#FF9F43'],
    highlights: [
      { label: 'Golden Shift Identification', desc: 'Highlights your top 10% highest-earning shifts with 👑.' },
      { label: 'Pay Period Sync', desc: 'Custom pay week cycles synced to your exact payday schedule.' },
      { label: 'Workplace Comparison', desc: 'Compare your hourly ROI across multiple restaurants or bars.' },
    ],
    proTip: '💡 Pro Tip: Tap any date on the Calendar tab to view or edit historical shifts.',
  },
  {
    icon: '🏛️',
    tag: 'TAX & INCOME PROOF',
    title: '2026 No-Tax Estimator & 1-Tap Proofs',
    subtitle: 'Stay ahead of upcoming tax legislation and generate official lease proofs in seconds.',
    gradient: ['#6C5CE7', '#4834D4'],
    highlights: [
      { label: '2026 "No Tax on Tips" Calculator', desc: 'Estimates your exact savings under federal exemption rules.' },
      { label: 'Official CSV Spreadsheets', desc: '1-click IRS-ready spreadsheet export for taxes and CPAs.' },
      { label: 'Apartment Lease Proofs', desc: 'Clean income verification statements for landlords and banks.' },
    ],
    proTip: '💡 Pro Tip: Access CSV reports anytime via Profile → Export Data.',
  },
  {
    icon: '🎁',
    tag: 'FREE MIGRATION & REWARDS',
    title: '1-Click Migration & Free Pro Rewards',
    subtitle: 'Switching apps? Bring your history free and earn free months by inviting coworkers.',
    gradient: ['#FF6B6B', '#EE5253'],
    highlights: [
      { label: '100% Free Data Migration', desc: 'Import past years of shifts from ServerLife, TipSee, or Excel.' },
      { label: 'Refer a TipStacker', desc: 'Give a friend an invite code; when they join Pro, both get 1 month free!' },
      { label: '256-Bit Bank Encryption', desc: 'Your financial records stay 100% encrypted and private to you.' },
    ],
    proTip: '💡 Pro Tip: Grab your invite code from the Gold Referral banner on the Profile tab.',
  },
];

export default function FeatureTourModal({ visible, onClose, onFinish }: FeatureTourModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  };

  const handleNext = () => {
    triggerHaptic();
    if (currentSlide < TOUR_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    triggerHaptic();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    triggerHaptic();
    if (onFinish) onFinish();
    onClose();
  };

  const slide = TOUR_SLIDES[currentSlide];

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Top Bar with Step Dots & Skip */}
          <View style={styles.topBar}>
            <View style={styles.stepDots}>
              {TOUR_SLIDES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentSlide && styles.dotActive,
                    idx < currentSlide && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={handleComplete} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Hero Icon with Gradient Background */}
            <View style={styles.heroContainer}>
              <LinearGradient
                colors={slide.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <Text style={styles.heroEmoji}>{slide.icon}</Text>
              </LinearGradient>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{slide.tag}</Text>
              </View>
            </View>

            {/* Slide Header */}
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

            {/* Feature Highlight Points */}
            <View style={styles.highlightList}>
              {slide.highlights.map((item, idx) => (
                <View key={idx} style={styles.highlightCard}>
                  <View style={styles.highlightNumberCircle}>
                    <Text style={styles.highlightNumber}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightLabel}>{item.label}</Text>
                    <Text style={styles.highlightDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pro Tip Box */}
            <View style={styles.proTipBox}>
              <Text style={styles.proTipText}>{slide.proTip}</Text>
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <View style={styles.navRow}>
              {currentSlide > 0 ? (
                <TouchableOpacity onPress={handlePrev} style={styles.backBtn} activeOpacity={0.8}>
                  <Text style={styles.backBtnText}>‹ Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 70 }} />
              )}

              <Text style={styles.slideCounter}>
                {currentSlide + 1} of {TOUR_SLIDES.length}
              </Text>

              <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>
                  {currentSlide === TOUR_SLIDES.length - 1 ? "Let's Stack! 🚀" : 'Next ›'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D0F14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    borderWidth: 1,
    borderColor: '#272C3A',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#272C3A',
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  dotCompleted: {
    backgroundColor: COLORS.primary + '88',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipText: {
    fontSize: 13,
    color: '#8B91A7',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  heroGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.glow,
  },
  heroEmoji: {
    fontSize: 44,
  },
  tagBadge: {
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 13,
    color: '#8B91A7',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  highlightList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  highlightNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  highlightNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
  highlightLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 12,
    color: '#8B91A7',
    lineHeight: 16,
  },
  proTipBox: {
    backgroundColor: '#FFD166' + '12',
    borderWidth: 1,
    borderColor: '#FFD166' + '44',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  proTipText: {
    fontSize: 12,
    color: '#FFD166',
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#272C3A',
    backgroundColor: '#11141A',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.base,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B91A7',
  },
  slideCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B91A7',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    ...SHADOWS.glow,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0F14',
  },
});
