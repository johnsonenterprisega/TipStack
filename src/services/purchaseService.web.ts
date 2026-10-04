import { profileService } from './api';
import { useAuthStore } from '../store';

export const ENTITLEMENT_ID = 'pro';

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  customerInfo?: any;
  userCancelled?: boolean;
  error?: string;
}

class WebPurchaseService {
  async initialize(userId?: string | null): Promise<void> {
    console.log('[RevenueCat Web] Simulated purchase service initialized.');
  }

  async logIn(userId: string): Promise<any> {
    return null;
  }

  async logOut(): Promise<void> {}

  async getOfferings(): Promise<any> {
    return {
      current: {
        identifier: 'default',
        monthly: {
          identifier: '$rc_monthly',
          product: {
            identifier: 'stackup_monthly_pro',
            priceString: '$2.99',
            price: 2.99,
            title: 'Monthly Pro Pass',
          },
        },
        annual: {
          identifier: '$rc_annual',
          product: {
            identifier: 'stackup_annual_pro',
            priceString: '$19.99',
            price: 19.99,
            title: 'Annual Pro Pass',

          },
        },
      },
    };
  }

  isCustomerPro(customerInfo: any): boolean {
    return true;
  }

  async purchasePackage(pkg: any): Promise<PurchaseResult> {
    const auth = useAuthStore.getState();
    const userId = auth.session?.user?.id;
    if (userId) {
      const { data } = await profileService.updateProfile(userId, {
        subscription_tier: 'pro',
      });
      if (data) {
        auth.setProfile(data);
      }
    }
    return {
      success: true,
      isPro: true,
    };
  }

  async restorePurchases(): Promise<PurchaseResult> {
    const auth = useAuthStore.getState();
    const isPro = auth.profile?.subscription_tier === 'pro';
    return {
      success: true,
      isPro,
    };
  }

  async checkProStatus(): Promise<boolean> {
    const auth = useAuthStore.getState();
    return auth.profile?.subscription_tier === 'pro';
  }
}

export const purchaseService = new WebPurchaseService();
