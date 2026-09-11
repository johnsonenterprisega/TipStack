import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../theme';

interface LegalViewerModalProps {
  visible: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export default function LegalViewerModal({ visible, type, onClose }: LegalViewerModalProps) {
  const isTerms = type === 'terms';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</Text>
            <Text style={styles.subtitle}>Johnson Enterprise Tech, LLC • Aug 2026</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
          {isTerms ? (
            <View style={styles.section}>
              <Text style={styles.h1}>Terms of Service</Text>
              <Text style={styles.meta}>Last Updated: August 22, 2026</Text>
              
              <Text style={styles.paragraph}>
                Welcome to TipStack, operated and owned by Johnson Enterprise Tech, LLC ("Company", "we", "us", or "our").
              </Text>
              <Text style={styles.paragraph}>
                By downloading, accessing, or using TipStack, you agree to be bound by these Terms of Service.
              </Text>

              <Text style={styles.h2}>1. US Users Only & Eligibility</Text>
              <Text style={styles.paragraph}>
                You must be at least 18 years old. TipStack is designed, operated, and intended solely for individuals residing and working in the United States.
              </Text>

              <Text style={styles.h2}>2. Nature of Service & Financial Disclaimer</Text>
              <Text style={styles.paragraph}>
                TipStack is a self-reporting shift tracking and personal record-keeping productivity tool. We are NOT certified public accountants (CPAs), tax preparers, or financial advisors.
              </Text>
              <Text style={styles.paragraph}>
                All estimated tax set-aside calculations and legislative deductions (including 2025 "No Tax on Tips" estimation models) are for informational estimation purposes only. You are solely responsible for reporting all earnings and tips accurately to your employer and the IRS.
              </Text>

              <Text style={styles.h2}>3. Subscriptions & In-App Purchases</Text>
              <Text style={styles.paragraph}>
                TipStack PRO is offered as an auto-renewing subscription ($4.99/month or $39.99/year). Subscriptions unlock unlimited workplaces, CSV tax exports, and ad-free usage.
              </Text>
              <Text style={styles.paragraph}>
                Subscriptions are processed directly by Apple App Store (iOS) or Google Play (Android). You may cancel anytime in your device's account settings.
              </Text>

              <Text style={styles.h2}>4. Intellectual Property</Text>
              <Text style={styles.paragraph}>
                All software, designs, trademarks, and branding ("TipStack", "Earn it. Track it. Stack it.") are the exclusive property of Johnson Enterprise Tech, LLC.
              </Text>

              <Text style={styles.h2}>5. Limitation of Liability</Text>
              <Text style={styles.paragraph}>
                To the maximum extent permitted by law, Johnson Enterprise Tech, LLC shall not be liable for any indirect, incidental, or consequential damages, loss of income, or tax penalties resulting from your use of the application.
              </Text>

              <Text style={styles.h2}>6. Contact Information</Text>
              <Text style={styles.paragraph}>
                Johnson Enterprise Tech, LLC{'\n'}
                Email: support@tipstack.app{'\n'}
                Website: https://tipstack.app
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.h1}>Privacy Policy</Text>
              <Text style={styles.meta}>Last Updated: August 22, 2026</Text>

              <Text style={styles.paragraph}>
                Johnson Enterprise Tech, LLC ("we", "us", or "our") respects your privacy and is committed to protecting your personal and financial shift data.
              </Text>

              <Text style={styles.h2}>1. Information We Collect</Text>
              <Text style={styles.paragraph}>
                • Account Data: Email, username, authentication tokens (Google/Apple sign-in).{'\n'}
                • Shift Logs: Dates, hours, cash tips, credit tips, tip-outs, hourly base wages, workplaces, and earnings goals.{'\n'}
                • Device Telemetry: Operating system, crash logs, and diagnostic performance metrics.
              </Text>

              <Text style={styles.h2}>2. How We Use Information</Text>
              <Text style={styles.paragraph}>
                We use your data strictly to calculate earnings totals, hourly rates, streak milestones, generate CSV reports, and synchronize your logs across your devices.
              </Text>

              <Text style={styles.h2}>3. We Do NOT Sell Your Data</Text>
              <Text style={styles.paragraph}>
                We do NOT sell, rent, monetize, or trade your personal information, shift logs, or tip earnings to third parties or advertisers.
              </Text>

              <Text style={styles.h2}>4. Data Security & Encryption</Text>
              <Text style={styles.paragraph}>
                All database records are stored in Supabase with TLS 1.3 transit encryption, AES-256 encryption at rest, and strict Row-Level Security (RLS) policies ensuring only you can access your data.
              </Text>

              <Text style={styles.h2}>5. Your Rights & Account Deletion</Text>
              <Text style={styles.paragraph}>
                You can export all your data via CSV or request permanent deletion of your account and records at any time directly in the app or by emailing privacy@tipstack.app.
              </Text>

              <Text style={styles.h2}>6. Contact Information</Text>
              <Text style={styles.paragraph}>
                Johnson Enterprise Tech, LLC{'\n'}
                Attention: Privacy Officer{'\n'}
                Email: privacy@tipstack.app{'\n'}
                Website: https://tipstack.app
              </Text>
            </View>
          )}

          <View style={styles.footerWrap}>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Johnson Enterprise Tech, LLC. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 60,
  },
  section: {
    gap: SPACING.sm,
  },
  h1: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  h2: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  paragraph: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footerWrap: {
    marginTop: SPACING['2xl'],
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerCopy: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
