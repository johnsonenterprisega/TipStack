import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  LOG_LEVEL,
} from 'react-native-purchases';
import { profileService } from './api';
import { useAuthStore } from '../store';

const REVENUECAT_APPLE_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_STgLcJjDJztMgzGlXRhNcwPDMrC';

export const ENTITLEMENT_ID = 'pro';

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  customerInfo?: CustomerInfo;
  userCancelled?: boolean;
  error?: string;
}

class NativePurchaseService {
  private isConfigured = false;
  private currentUserId: string | null = null;

  /**
   * Initializes RevenueCat with the Apple Public API Key and logs in the current user if available.
   */
  async initialize(userId?: string | null): Promise<void> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    if (!REVENUECAT_APPLE_KEY) {
      console.warn('[RevenueCat] No API key configured in EXPO_PUBLIC_REVENUECAT_APPLE_KEY');
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.INFO);
      }

      if (!this.isConfigured) {
        Purchases.configure({
          apiKey: REVENUECAT_APPLE_KEY,
          appUserID: userId || null,
        });
        this.isConfigured = true;
        this.currentUserId = userId || null;
        console.log('[RevenueCat] Configured native SDK with key:', REVENUECAT_APPLE_KEY.slice(0, 8) + '...');
      } else if (userId && userId !== this.currentUserId) {
        await this.logIn(userId);
      }

      // Listen for subscription status updates from StoreKit / background renewals
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.handleCustomerInfoUpdate(info);
      });
    } catch (e: any) {
      console.warn('[RevenueCat] Initialization error:', e.message || e);
    }
  }

  /**
   * Associate RevenueCat customer with Supabase user ID
   */
  async logIn(userId: string): Promise<CustomerInfo | null> {
    if (!this.isConfigured) {
      await this.initialize(userId);
    }
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      this.currentUserId = userId;
      await this.handleCustomerInfoUpdate(customerInfo);
      return customerInfo;
    } catch (e: any) {
      console.warn('[RevenueCat] LogIn error:', e.message || e);
      return null;
    }
  }

  /**
   * Clear user ID on logout
   */
  async logOut(): Promise<void> {
    if (!this.isConfigured) return;
    try {
      await Purchases.logOut();
      this.currentUserId = null;
    } catch (e: any) {
      console.warn('[RevenueCat] LogOut error:', e.message || e);
    }
  }

  /**
   * Fetches current offerings & packages (Monthly $2.99, Annual $19.99 with 14-day trial)
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      if (!this.isConfigured) {
        await this.initialize(this.currentUserId);
      }
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        console.log('[RevenueCat] No current offering found or configured yet.');
      }
      return offerings;
    } catch (e: any) {
      console.warn('[RevenueCat] Failed to fetch offerings:', e.message || e);
      return null;
    }
  }

  /**
   * Checks if customer currently has active Pro entitlement
   */
  isCustomerPro(customerInfo: CustomerInfo | null | undefined): boolean {
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
      return false;
    }
    // Match 'pro', 'Pro', or any active entitlement
    const active = customerInfo.entitlements.active;
    return (
      Boolean(active[ENTITLEMENT_ID]) ||
      Boolean(active['Pro']) ||
      Boolean(active['premium']) ||
      Object.keys(active).length > 0
    );
  }

  /**
   * Triggers Apple Pay / StoreKit purchase sheet for a package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      if (!this.isConfigured) {
        await this.initialize(this.currentUserId);
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = this.isCustomerPro(customerInfo);

      if (isPro) {
        await this.syncProStatusWithSupabase(true);
      }

      return {
        success: isPro,
        isPro,
        customerInfo,
      };
    } catch (e: any) {
      if (e.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
        return { success: false, isPro: false, userCancelled: true };
      }
      console.warn('[RevenueCat] Purchase failed:', e.message || e);
      return {
        success: false,
        isPro: false,
        error: e.message || 'Payment could not be completed.',
      };
    }
  }

  /**
   * Restores existing purchases for the user (required by Apple guidelines)
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isConfigured) {
        await this.initialize(this.currentUserId);
      }

      const customerInfo = await Purchases.restorePurchases();
      const isPro = this.isCustomerPro(customerInfo);

      await this.syncProStatusWithSupabase(isPro);

      return {
        success: true,
        isPro,
        customerInfo,
      };
    } catch (e: any) {
      console.warn('[RevenueCat] Restore failed:', e.message || e);
      return {
        success: false,
        isPro: false,
        error: e.message || 'Could not restore purchases.',
      };
    }
  }

  /**
   * Refresh and check latest customer info from Apple
   */
  async checkProStatus(): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        await this.initialize(this.currentUserId);
      }
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = this.isCustomerPro(customerInfo);
      await this.syncProStatusWithSupabase(isPro);
      return isPro;
    } catch (e: any) {
      console.warn('[RevenueCat] Failed to check customer info:', e.message || e);
      return false;
    }
  }

  /**
   * Internal listener for asynchronous updates
   */
  private async handleCustomerInfoUpdate(customerInfo: CustomerInfo) {
    const isPro = this.isCustomerPro(customerInfo);
    console.log(`[RevenueCat] CustomerInfo updated. Active Pro: ${isPro}`);
    await this.syncProStatusWithSupabase(isPro);
  }

  /**
   * Syncs active subscription tier to Supabase profiles & auth store
   */
  private async syncProStatusWithSupabase(isPro: boolean): Promise<void> {
    const auth = useAuthStore.getState();
    const userId = auth.session?.user?.id || this.currentUserId;
    if (!userId) return;

    const newTier = isPro ? 'pro' : 'free';
    if (auth.profile?.subscription_tier === newTier) {
      return; // Already in sync
    }

    try {
      const { data, error } = await profileService.updateProfile(userId, {
        subscription_tier: newTier,
      });

      if (!error && data) {
        auth.setProfile(data);
        console.log(`[RevenueCat] Supabase profile subscription_tier synced to '${newTier}'`);
      }
    } catch (e) {
      console.warn('[RevenueCat] Failed to sync subscription_tier to Supabase', e);
    }
  }
}

export const purchaseService = new NativePurchaseService();
