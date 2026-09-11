import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../theme';

interface AdBannerProps {
  style?: any;
}

export default function AdBanner({ style }: AdBannerProps) {
  const { profile } = useAuthStore();
  const isPro = profile?.subscription_tier === 'pro';

  // Pro Subscribers NEVER see ads
  if (isPro) {
    return null;
  }

  return (
    <View style={[styles.webContainer, style]}>
      <View style={styles.webBadge}>
        <Text style={styles.webAdText}>SPONSORED</Text>
      </View>
      <Text style={styles.webTitle}>Upgrade to TipStack PRO for 100% Ad-Free Experience ⭐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  webBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webAdText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  webTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
