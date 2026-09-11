import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import mobileAds, { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const STORAGE_KEY_TASK_COUNT = '@tipstack_ad_task_counter';
const AD_ACTION_THRESHOLD = 2; // Show full-screen ad every 2 completed tasks for free users

// Live AdMob Credentials
const LIVE_BANNER_ID =
  process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-8622523503612039/5727830748';
const LIVE_INTERSTITIAL_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-8622523503612039/5156985106';

// Test Ad Unit IDs (used in development to prevent self-click policy strikes)
const TEST_BANNER_ID = TestIds.ADAPTIVE_BANNER;
const TEST_INTERSTITIAL_ID = TestIds.INTERSTITIAL;

class NativeAdService {
  private isInitialized = false;
  private interstitial: InterstitialAd | null = null;
  private interstitialLoaded = false;
  private isShowing = false;
  private pendingShowOnLoad = false;
  private taskCount = 0;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    this.loadTaskCount();
  }

  private async loadTaskCount(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_TASK_COUNT);
      if (saved) {
        this.taskCount = parseInt(saved, 10) || 0;
        console.log(`[AdMob] Loaded persistent task count: ${this.taskCount}/${AD_ACTION_THRESHOLD}`);
      }
    } catch (e) {
      console.warn('[AdMob] Failed to read task count from storage', e);
    }
  }

  private async saveTaskCount(count: number): Promise<void> {
    this.taskCount = count;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TASK_COUNT, count.toString());
    } catch (e) {
      console.warn('[AdMob] Failed to save task count to storage', e);
    }
  }

  getBannerAdUnitId(): string {
    if (__DEV__) {
      return TEST_BANNER_ID;
    }
    return LIVE_BANNER_ID;
  }

  getInterstitialAdUnitId(): string {
    if (__DEV__) {
      return TEST_INTERSTITIAL_ID;
    }
    return LIVE_INTERSTITIAL_ID;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'ios') {
        const { status } = await requestTrackingPermissionsAsync();
        console.log('[AdMob] App Tracking Transparency Status:', status);
      }

      await mobileAds().initialize();
      this.isInitialized = true;
      console.log('[AdMob] SDK initialized successfully');
      this.preloadInterstitial();
    } catch (e) {
      console.warn('[AdMob] Failed to initialize Google Mobile Ads', e);
    }
  }

  preloadInterstitial(): void {
    try {
      // Clean up previous listeners
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];

      const adUnitId = this.getInterstitialAdUnitId();
      console.log('[AdMob] Preloading interstitial ad with ID:', adUnitId);

      this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] ✅ Interstitial Ad LOADED and ready to display');
        this.interstitialLoaded = true;

        // If an ad was queued while waiting for network download, display it now!
        if (this.pendingShowOnLoad && !this.isShowing) {
          console.log('[AdMob] 🎬 Presenting queued interstitial now that loading completed...');
          this.pendingShowOnLoad = false;
          this.isShowing = true;
          this.interstitial?.show().catch((err: any) => {
            console.warn('[AdMob] Failed to show queued interstitial ad', err);
            this.isShowing = false;
            this.preloadInterstitial();
          });
        }
      });

      const unsubClosed = this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial Ad CLOSED by user');
        this.interstitialLoaded = false;
        this.isShowing = false;
        this.pendingShowOnLoad = false;
        this.preloadInterstitial();
      });

      const unsubError = this.interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('[AdMob] ❌ Interstitial Ad failed to load:', error);
        this.interstitialLoaded = false;
        this.isShowing = false;
        this.pendingShowOnLoad = false;
      });

      this.unsubscribers.push(unsubLoaded, unsubClosed, unsubError);
      this.interstitial.load();
    } catch (e) {
      console.warn('[AdMob] Failed to create interstitial ad', e);
    }
  }

  async recordTaskAndShowInterstitial(isPro: boolean, taskName: string = 'task'): Promise<void> {
    if (isPro) {
      console.log(`[AdMob] User is Pro, skipping ad for ${taskName}`);
      return;
    }
    if (this.isShowing) {
      console.log('[AdMob] Interstitial is already presenting on screen');
      return;
    }

    const nextCount = this.taskCount + 1;
    await this.saveTaskCount(nextCount);
    console.log(`[AdMob] Task completed [${taskName}]. Current progress: ${nextCount}/${AD_ACTION_THRESHOLD}`);

    if (nextCount >= AD_ACTION_THRESHOLD) {
      await this.saveTaskCount(0);

      if (this.interstitial && this.interstitialLoaded) {
        try {
          console.log('[AdMob] 🎬 Showing Interstitial Ad now...');
          this.isShowing = true;
          await this.interstitial.show();
        } catch (e) {
          console.warn('[AdMob] Failed to display interstitial ad', e);
          this.isShowing = false;
          this.preloadInterstitial();
        }
      } else {
        console.log('[AdMob] Interstitial still loading in background. Queuing to show as soon as ready...');
        this.pendingShowOnLoad = true;
        this.preloadInterstitial();
      }
    }
  }

  // Alias for backward compatibility
  async showShiftLoggedInterstitial(isPro: boolean): Promise<void> {
    return this.recordTaskAndShowInterstitial(isPro, 'log_shift');
  }

  async forceShowInterstitial(): Promise<boolean> {
    if (this.interstitial && this.interstitialLoaded) {
      try {
        console.log('[AdMob] 🎬 Force showing Interstitial Ad...');
        this.isShowing = true;
        await this.interstitial.show();
        return true;
      } catch (e) {
        console.warn('[AdMob] Failed to force display interstitial ad', e);
        this.isShowing = false;
        this.preloadInterstitial();
        return false;
      }
    } else {
      console.log('[AdMob] Interstitial not ready yet, loading now...');
      this.pendingShowOnLoad = true;
      this.preloadInterstitial();
      return false;
    }
  }
}

export const adService = new NativeAdService();
