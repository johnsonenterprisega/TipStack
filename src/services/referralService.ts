import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const REFERRAL_STATS_KEY = '@tipstack_referral_stats';

export interface ReferralStats {
  referralCode: string;
  referredCount: number;
  freeMonthsEarned: number;
  proCreditDays: number;
}

export const referralService = {
  /**
   * Generates a clean, memorable alphanumeric referral code based on username or user ID.
   */
  generateReferralCode(username?: string | null, userId?: string | null): string {
    if (username && username.trim().length >= 3) {
      const clean = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
      const suffix = Math.floor(100 + Math.random() * 900);
      return `STACK-${clean}${suffix}`;
    }
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `STACK-${rand}`;
  },

  /**
   * Loads or creates user's referral stats.
   */
  async getReferralStats(userId?: string | null, username?: string | null): Promise<ReferralStats> {
    try {
      const saved = await AsyncStorage.getItem(REFERRAL_STATS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    const newCode = this.generateReferralCode(username, userId);
    const initialStats: ReferralStats = {
      referralCode: newCode,
      referredCount: 0,
      freeMonthsEarned: 0,
      proCreditDays: 0,
    };

    try {
      await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(initialStats));
    } catch {}

    return initialStats;
  },

  /**
   * Records a new referral conversion (friend purchased Pro).
   * Adds +1 to referredCount and +1 month (30 days) of Pro credit.
   */
  async creditSuccessfulReferral(): Promise<ReferralStats> {
    const stats = await this.getReferralStats();
    const updated: ReferralStats = {
      ...stats,
      referredCount: stats.referredCount + 1,
      freeMonthsEarned: stats.freeMonthsEarned + 1,
      proCreditDays: stats.proCreditDays + 30,
    };

    try {
      await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(updated));
    } catch {}

    return updated;
  },

  /**
   * Pre-composes the viral invite message to share on WhatsApp, iMessage, Instagram, or Twitter.
   */
  getShareMessage(code: string): { title: string; message: string; url: string } {
    const shareUrl = 'https://manually-moscow-locked-reverse.trycloudflare.com/onboarding';
    return {
      title: 'Join me on TipStack 💰',
      message: `Hey! I've been tracking my tips with TipStack — it calculates your true take-home hourly after tip-outs, tracks taxes, and helps you keep more cash.\n\nUse my invite code ${code} when you sign up! 🚀\n${shareUrl}`,
      url: shareUrl,
    };
  },
};
