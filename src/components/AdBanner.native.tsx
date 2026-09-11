import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAuthStore } from '../store';
import { adService } from '../services/adService';
import { SPACING } from '../theme';

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

  const adUnitId = adService.getBannerAdUnitId();

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    minHeight: 50,
  },
});
