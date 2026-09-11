import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../store/themeStore';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface SecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityModal({ visible, onClose }: SecurityModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <View style={[styles.shieldBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Security & Privacy
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  How TipStack protects your money & personal data
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Top Assurance Banner */}
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBanner}
            >
              <Text style={styles.heroTitle}>🔒 Bank-Grade 256-Bit Protection</Text>
              <Text style={styles.heroDesc}>
                Your tip logs and earnings are confidential. We treat your hustle with the same level
                of encryption and privacy as leading financial institutions.
              </Text>
            </LinearGradient>

            {/* Security Pillars */}
            <View style={styles.pillarsList}>
              {/* Pillar 1: Row Level Security */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>👤</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    PostgreSQL Row Level Security (RLS)
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  Our database utilizes strict kernel-level Row Level Security policies. Your shifts,
                  wages, and workplaces are cryptographically locked to your authenticated user ID.
                  No other user can ever query or view your earnings.
                </Text>
              </View>

              {/* Pillar 2: In-Transit Encryption */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>🔐</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    End-to-End TLS 1.3 Encryption
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  Every byte sent between TipStack on your phone and our cloud infrastructure is
                  encrypted in-flight with 256-bit TLS 1.3 / SSL encryption, preventing any
                  eavesdropping on public Wi-Fi or cellular networks.
                </Text>
              </View>

              {/* Pillar 3: Zero Bank Credentials */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>🚫</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    Zero Bank Access or SSN Required
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  TipStack is a privacy-first logging tracker. We never ask for your bank login,
                  routing numbers, Plaid account links, or Social Security Number. Your financial
                  accounts remain completely untouched and disconnected.
                </Text>
              </View>

              {/* Pillar 4: Encrypted at Rest */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>🗄️</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    AES-256 Storage at Rest
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  All database disks and encrypted backups are secured using military-grade AES-256
                  storage encryption compliant with SOC 2, HIPAA, and ISO 27001 standards.
                </Text>
              </View>

              {/* Pillar 5: Device Keychain Token Protection */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>📱</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    Apple Secure Enclave & Keychain
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  Your authentication session tokens are stored directly in your phone’s hardware
                  secure enclave (iOS Keychain), ensuring only your authorized device can unlock your
                  session.
                </Text>
              </View>

              {/* Pillar 6: Data Ownership */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>📄</Text>
                  <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                    100% Data Ownership & Export
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
                  You own your data. You can export complete CSV reports of your shifts and tax logs
                  anytime, or delete records with 1 tap. We never sell your personal or financial data
                  to third-party advertisers.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: colors.textPrimary }]}>Got It — I'm Protected</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.base,
    paddingHorizontal: SPACING.base,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  shieldBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  heroBanner: {
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    ...SHADOWS.glow,
  },
  heroTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#0D0F14',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: 'rgba(13, 15, 20, 0.85)',
    lineHeight: 18,
    fontWeight: '600',
  },
  pillarsList: {
    gap: SPACING.sm,
  },
  pillarCard: {
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pillarEmoji: {
    fontSize: 18,
  },
  pillarTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
  pillarBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  doneBtn: {
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  doneBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
});
