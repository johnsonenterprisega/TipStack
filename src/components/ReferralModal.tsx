import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { referralService, ReferralStats } from '../services/referralService';
import { useAuthStore } from '../store';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface ReferralModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReferralModal({ visible, onClose }: ReferralModalProps) {
  const { profile, session } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStats();
    }
  }, [visible]);

  const loadStats = async () => {
    const data = await referralService.getReferralStats(session?.user?.id, profile?.username);
    setStats(data);
  };

  const handleCopy = async () => {
    if (!stats?.referralCode) return;
    await Clipboard.setStringAsync(stats.referralCode);
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!stats?.referralCode) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }

    const { message, title, url } = referralService.getShareMessage(stats.referralCode);

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title, text: message, url });
        } else {
          await Clipboard.setStringAsync(`${message}`);
          Alert.alert('Link Copied!', 'Invite message copied to your clipboard. Paste it into SMS, WhatsApp, or Instagram!');
        }
      } else {
        await Share.share(
          {
            message,
            title,
            url,
          },
          {
            dialogTitle: 'Share TipStack with Fellow Hustlers',
          }
        );
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const referralCode = stats?.referralCode || 'STACK-VIP';

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Drag Handle */}
          <View style={styles.dragBar} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header Banner */}
            <LinearGradient colors={['#FFD166', '#FF9F43', '#00C9A7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
              <View style={styles.giftIconWrap}>
                <Text style={{ fontSize: 44 }}>🎁</Text>
              </View>
              <View style={styles.programPill}>
                <Text style={styles.programPillText}>TIPSTACKER REWARDS</Text>
              </View>
              <Text style={styles.heroTitle}>Refer a Fellow TipStacker</Text>
              <Text style={styles.heroSub}>Get 1 Month of Pro Free for every friend who joins!</Text>
            </LinearGradient>

            {/* Referral Code Card */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>YOUR PERSONAL INVITE CODE</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
                  <Text style={styles.copyBtnText}>{copied ? '✓ Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.88}>
                <Text style={styles.shareBtnText}>📲 Share Invite Link to Friends</Text>
              </TouchableOpacity>
            </View>

            {/* Live Stats Tracker */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.referredCount || 0}</Text>
                <Text style={styles.statLabel}>Friends Referred</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: COLORS.accent }]}>
                  {stats?.freeMonthsEarned || 0} mo
                </Text>
                <Text style={styles.statLabel}>Free Pro Earned</Text>
              </View>
            </View>

            {/* How It Works (3 Steps) */}
            <View style={styles.howSection}>
              <Text style={styles.howTitle}>HOW IT WORKS</Text>

              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Share your invite code</Text>
                  <Text style={styles.stepDesc}>
                    Send your link to servers, bartenders, baristas, and tipped workers you know.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>They join & upgrade</Text>
                  <Text style={styles.stepDesc}>
                    When they sign up and start a paid plan (monthly or yearly), your account is credited.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>You both stack rewards</Text>
                  <Text style={styles.stepDesc}>
                    You get 30 days of TipStack Pro completely free. No limit — refer 12 friends, get a full year free!
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#11141A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#272C3A',
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#3F4556',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  heroBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glow,
  },
  giftIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(13, 15, 20, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  programPill: {
    backgroundColor: 'rgba(13, 15, 20, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  programPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD166',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0D0F14',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(13, 15, 20, 0.85)',
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B91A7',
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2230',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '55',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0F14',
  },
  shareBtn: {
    backgroundColor: '#272C3A',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    marginBottom: SPACING.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8B91A7',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#272C3A',
  },
  howSection: {
    gap: 14,
    marginBottom: SPACING.xl,
  },
  howTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B91A7',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '22',
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 12,
    color: '#8B91A7',
    lineHeight: 16,
  },
  closeBtn: {
    backgroundColor: '#1E2230',
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B91A7',
  },
});
