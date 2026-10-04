import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAuthStore } from '../store';
import { adService } from '../services/adService';
import { SPACING } from '../theme';

interface AdBannerProps {
  style?: any;
}

export default function AdBanner({ style }: AdBannerProps) {
  const { profile } = useAuthStore();
  const [adUnitId, setAdUnitId] = useState<string>(() => adService.getBannerAdUnitId());
  const isPro = profile?.subscription_tier === 'pro';

  // Pro Subscribers NEVER see ads
  if (isPro) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.warn('[AdMob Banner] Ad failed to load with unitId:', adUnitId, error);
          // If live ad failed (common during TestFlight before App Store launch), fall back to official Test Banner
          if (adUnitId !== TestIds.ADAPTIVE_BANNER) {
            console.log('[AdMob Banner] Falling back to Google Test Banner unit ID');
            setAdUnitId(TestIds.ADAPTIVE_BANNER);
          }
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
