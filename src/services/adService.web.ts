// Web implementation of adService with live interactive simulation
const STORAGE_KEY_TASK_COUNT = '@tipstack_ad_task_counter_web';
const AD_ACTION_THRESHOLD = 2; // Every 2 tasks on free tier

class WebAdService {
  private taskCount = 0;

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY_TASK_COUNT);
        if (saved) {
          this.taskCount = parseInt(saved, 10) || 0;
        }
      }
    } catch {}
  }

  getBannerAdUnitId(): string {
    return 'web-banner-ad-id';
  }

  getInterstitialAdUnitId(): string {
    return 'web-interstitial-ad-id';
  }

  async initialize(): Promise<void> {
    console.log('[AdMob Web] Initialized simulated AdMob engine.');
  }

  preloadInterstitial(): void {
    // No-op on web
  }

  async recordTaskAndShowInterstitial(isPro: boolean, taskName: string = 'task'): Promise<void> {
    if (isPro) {
      console.log(`[AdMob Web] User is Pro, skipping ad for ${taskName}`);
      return;
    }

    this.taskCount += 1;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_TASK_COUNT, this.taskCount.toString());
      }
    } catch {}

    console.log(`[AdMob Web] Task completed [${taskName}]. Count: ${this.taskCount}/${AD_ACTION_THRESHOLD}`);

    if (this.taskCount >= AD_ACTION_THRESHOLD) {
      this.taskCount = 0;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY_TASK_COUNT, '0');
        }
      } catch {}

      console.log('🎬 [AdMob Simulated Interstitial] Full-screen Ad display triggered!');
      // In web preview, display a non-blocking toast/log or alert for verification
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          alert('🎬 [AdMob Preview] Full-Screen Interstitial Ad Triggered!\n(Triggered after 2 completed tasks on Free tier. Will display native AdMob video on iPhone/Android).');
        }, 500);
      }
    }
  }

  async showShiftLoggedInterstitial(isPro: boolean): Promise<void> {
    return this.recordTaskAndShowInterstitial(isPro, 'log_shift');
  }

  async forceShowInterstitial(): Promise<boolean> {
    alert('🎬 [AdMob Test] Full-Screen Interstitial Ad Triggered!\n(Native iOS/Android will present the real Google AdMob interstitial).');
    return true;
  }
}

export const adService = new WebAdService();
