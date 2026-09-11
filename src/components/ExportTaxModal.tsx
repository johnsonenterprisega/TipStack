import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useShiftStore, useJobStore } from '../store';
import { exportService, tipCalculator } from '../services/api';
import { adService } from '../services/adService';
import { getCurrentPayPeriod } from '../utils/payPeriod';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';
import { format, startOfYear, startOfMonth } from 'date-fns';

interface ExportTaxModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall: () => void;
  onOpenMigrate?: () => void;
}

type PeriodFilter = 'pay_period' | 'month' | 'ytd' | 'all';

export default function ExportTaxModal({
  visible,
  onClose,
  onOpenPaywall,
  onOpenMigrate,
}: ExportTaxModalProps) {
  const { profile } = useAuthStore();
  const { shifts } = useShiftStore();
  const { jobs } = useJobStore();
  const [period, setPeriod] = useState<PeriodFilter>('pay_period');
  const [isExporting, setIsExporting] = useState(false);
  const [showNoTaxTips, setShowNoTaxTips] = useState(true);

  const isPro = profile?.subscription_tier === 'pro';

  // Filter shifts based on selected period
  const filteredShifts = useMemo(() => {
    const now = new Date();
    if (period === 'pay_period') {
      const currentPayPeriod = getCurrentPayPeriod(now, profile?.pay_period_start_day ?? 3);
      return shifts.filter(
        (s) => s.date >= currentPayPeriod.startDateStr && s.date <= currentPayPeriod.endDateStr
      );
    } else if (period === 'month') {
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      return shifts.filter((s) => s.date >= monthStart);
    } else if (period === 'ytd') {
      const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
      return shifts.filter((s) => s.date >= yearStart);
    }
    return shifts;
  }, [shifts, period, profile]);

  const taxSummary = useMemo(() => {
    return exportService.calculateTaxSummary(filteredShifts, jobs, 0.20);
  }, [filteredShifts, jobs]);

  const handleDownloadCSV = async () => {
    if (!isPro) {
      onOpenPaywall();
      return;
    }

    if (filteredShifts.length === 0) {
      if (Platform.OS === 'web') window.alert('No shifts to export for the selected period.');
      else Alert.alert('No Shifts', 'There are no logged shifts to export for this timeframe.');
      return;
    }

    setIsExporting(true);
    try {
      const csvString = exportService.generateCSV(filteredShifts, jobs);
      const filename = `TipStack_Shifts_${period}_${format(new Date(), 'yyyyMMdd')}.csv`;

      if (Platform.OS === 'web') {
        // Browser direct download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Native iOS / Android file share
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export TipStack Shift Logs',
            UTI: 'public.comma-separated-values-text',
          });
          setTimeout(() => {
            adService.recordTaskAndShowInterstitial(
              profile?.subscription_tier === 'pro',
              'export_csv'
            );
          }, 600);
        } else {
          Alert.alert('Export Ready', `File saved to ${fileUri}`);
        }
      }
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(`Export error: ${e.message}`);
      else Alert.alert('Export Error', e.message || 'Could not export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>📄 CSV & Tax Reports</Text>
              <Text style={styles.subtitle}>IRS-ready shift export & tax set-aside calculations</Text>
            </View>

            {/* Timeframe Filter Chips */}
            <View style={styles.filterRow}>
              {[
                { id: 'pay_period', label: 'Pay Period' },
                { id: 'month', label: 'This Month' },
                { id: 'ytd', label: 'Year to Date' },
                { id: 'all', label: 'All Time' },
              ].map((filter) => {
                const isActive = period === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setPeriod(filter.id as PeriodFilter)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tax Overview Card */}
            <View style={styles.taxCard}>
              <View style={styles.taxHeader}>
                <Text style={styles.taxCardTitle}>INCOME SUMMARY ({filteredShifts.length} shifts)</Text>
                <Text style={styles.taxRateBadge}>20% Est. Tax Rate</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Total Hours</Text>
                  <Text style={styles.statBoxVal}>{taxSummary.totalHours} hrs</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Hourly Wages</Text>
                  <Text style={styles.statBoxVal}>{tipCalculator.formatCurrency(taxSummary.totalWages)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Net Tips</Text>
                  <Text style={[styles.statBoxVal, { color: COLORS.primary }]}>
                    {tipCalculator.formatCurrency(taxSummary.totalNetTips)}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Gross Income</Text>
                  <Text style={[styles.statBoxVal, { color: COLORS.accent }]}>
                    {tipCalculator.formatCurrency(taxSummary.totalGrossIncome)}
                  </Text>
                </View>
              </View>

              {/* Tax Estimate Breakdown */}
              <View style={styles.taxDivider} />
              <View style={styles.taxRow}>
                <Text style={styles.taxRowLabel}>Standard Tax Set-Aside (Est.):</Text>
                <Text style={styles.taxRowVal}>{tipCalculator.formatCurrency(taxSummary.standardEstimatedTax)}</Text>
              </View>

              {/* 2025 No Tax on Tips Highlight */}
              <View style={styles.noTaxBanner}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.noTaxTitle}>🏛️ 2026 "No Tax on Tips" Estimator</Text>
                  <TouchableOpacity onPress={() => setShowNoTaxTips(!showNoTaxTips)}>
                    <Text style={styles.noTaxToggle}>{showNoTaxTips ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {showNoTaxTips && (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    <Text style={styles.noTaxDesc}>
                      Under proposed federal legislation exempting tips from income tax, only your hourly wage is taxed.
                    </Text>
                    <View style={styles.noTaxSavingsRow}>
                      <Text style={styles.noTaxSavingsLabel}>Potential Tax Savings:</Text>
                      <Text style={styles.noTaxSavingsVal}>
                        +{tipCalculator.formatCurrency(taxSummary.estimatedSavings)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Export CSV CTA */}
            <TouchableOpacity
              style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
              onPress={handleDownloadCSV}
              disabled={isExporting}
              activeOpacity={0.85}
            >
              {isExporting ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={styles.exportBtnText}>
                  {isPro ? '📥 Download Full CSV Spreadsheet' : '⭐ Unlock CSV Export (PRO)'}
                </Text>
              )}
            </TouchableOpacity>

            {!isPro && (
              <Text style={styles.proHint}>
                TipStack Pro members get unlimited 1-click CSV exports with custom date ranges.
              </Text>
            )}

            {/* Migration Tool Link */}
            <TouchableOpacity
              style={styles.migrateLinkRow}
              onPress={() => {
                onClose();
                if (onOpenMigrate) onOpenMigrate();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.migrateLinkText}>
                Switching from ServerLife or TipSee? <Text style={{ color: COLORS.primary, fontWeight: '800' }}>Import & Migrate CSV →</Text>
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Close</Text>
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
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  header: {
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.base,
  },
  filterChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0D0F14',
    fontWeight: '700',
  },
  taxCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.base,
  },
  taxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  taxCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  taxRateBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBoxLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statBoxVal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  taxDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  taxRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  taxRowVal: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: COLORS.error,
  },
  noTaxBanner: {
    backgroundColor: '#00C9A715',
    borderColor: COLORS.primary + '55',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  noTaxTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  noTaxToggle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  noTaxDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  noTaxSavingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '33',
  },
  noTaxSavingsLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noTaxSavingsVal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.primary,
  },
  exportBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.glow,
  },
  exportBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#0D0F14',
  },
  proHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  migrateLinkRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  migrateLinkText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
