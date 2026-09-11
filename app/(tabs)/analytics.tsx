import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useShiftStore, useJobStore, useAuthStore } from '../../src/store';
import { tipCalculator } from '../../src/services/api';
import ProPaywallModal from '../../src/components/ProPaywallModal';
import ExportTaxModal from '../../src/components/ExportTaxModal';
import AdBanner from '../../src/components/AdBanner';
import { useAppTheme } from '../../src/store/themeStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';
import {
  format,
  subDays,
  parseISO,
} from 'date-fns';

const { width } = Dimensions.get('window');

const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const { shifts } = useShiftStore();
  const { jobs } = useJobStore();
  const { profile } = useAuthStore();
  const isPro = profile?.subscription_tier === 'pro';

  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [activeMatrixTab, setActiveMatrixTab] = useState<'hourly' | 'tips'>('hourly');

  // ─── 1. CORE & SUMMARY STATS ────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (shifts.length === 0) {
      return {
        totalTips: 0,
        totalGross: 0,
        totalCash: 0,
        totalCredit: 0,
        totalTipOut: 0,
        totalHours: 0,
        avgPerShift: 0,
        avgPerHour: 0,
        bestDay: 0,
        dayOfWeekData: [],
        last7Days: [],
        jobStats: [],
      };
    }

    const totalTips = shifts.reduce((s, sh) => s + sh.net_tips, 0);
    const totalGross = shifts.reduce((s, sh) => s + (sh.cash_tips + sh.credit_tips), 0);
    const totalCash = shifts.reduce((s, sh) => s + sh.cash_tips, 0);
    const totalCredit = shifts.reduce((s, sh) => s + sh.credit_tips, 0);
    const totalTipOut = shifts.reduce((s, sh) => s + sh.tip_out_amount, 0);
    const totalHours = shifts.reduce((s, sh) => s + sh.hours_worked, 0);

    const avgPerShift = totalTips / shifts.length;

    const shiftsWithHours = shifts.filter((s) => s.hours_worked > 0);
    const avgPerHour = totalHours > 0 ? totalTips / totalHours : 0;
    const bestDay = Math.max(...shifts.map((s) => s.net_tips));

    // ─── 2. #1 GOLDEN SHIFT MATRIX (Day of Week Analysis) ─────────────────────
    const dayTotals: Record<number, { sumTips: number; sumHours: number; count: number }> = {};
    for (let i = 0; i < 7; i++) {
      dayTotals[i] = { sumTips: 0, sumHours: 0, count: 0 };
    }

    for (const shift of shifts) {
      const dow = new Date(shift.date + 'T12:00:00').getDay();
      dayTotals[dow].sumTips += shift.net_tips;
      dayTotals[dow].sumHours += shift.hours_worked;
      dayTotals[dow].count += 1;
    }

    const dayOfWeekData = DOW_SHORT.map((label, i) => {
      const count = dayTotals[i].count;
      const sumTips = dayTotals[i].sumTips;
      const sumHours = dayTotals[i].sumHours;
      const avgTips = count > 0 ? sumTips / count : 0;
      const avgHourly = sumHours > 0 ? sumTips / sumHours : avgTips > 0 ? avgTips / 5 : 0;

      return {
        label,
        fullName: DOW_NAMES[i],
        avgTips,
        avgHourly,
        count,
        totalHours: sumHours,
      };
    });

    // ─── 3. #2 WORKPLACE HEAD-TO-HEAD ROI ─────────────────────────────────────
    const jobMap: Record<
      string,
      {
        jobId: string;
        jobName: string;
        color: string;
        hourlyWage: number;
        shiftCount: number;
        totalTips: number;
        totalHours: number;
        totalTipOut: number;
        totalGross: number;
      }
    > = {};

    for (const job of jobs) {
      jobMap[job.id] = {
        jobId: job.id,
        jobName: job.name,
        color: job.color,
        hourlyWage: job.hourly_wage || 0,
        shiftCount: 0,
        totalTips: 0,
        totalHours: 0,
        totalTipOut: 0,
        totalGross: 0,
      };
    }

    for (const s of shifts) {
      if (!jobMap[s.job_id]) {
        const found = jobs.find((j) => j.id === s.job_id);
        jobMap[s.job_id] = {
          jobId: s.job_id,
          jobName: found?.name || 'Workplace',
          color: found?.color || COLORS.primary,
          hourlyWage: found?.hourly_wage || 0,
          shiftCount: 0,
          totalTips: 0,
          totalHours: 0,
          totalTipOut: 0,
          totalGross: 0,
        };
      }
      jobMap[s.job_id].shiftCount += 1;
      jobMap[s.job_id].totalTips += s.net_tips;
      jobMap[s.job_id].totalHours += s.hours_worked;
      jobMap[s.job_id].totalTipOut += s.tip_out_amount;
      jobMap[s.job_id].totalGross += (s.cash_tips + s.credit_tips);
    }

    const jobStats = Object.values(jobMap)
      .filter((j) => j.shiftCount > 0)
      .map((j) => {
        const wageEarnings = j.totalHours * j.hourlyWage;
        const totalTakeHome = wageEarnings + j.totalTips;
        const effectiveHourly =
          j.totalHours > 0 ? totalTakeHome / j.totalHours : j.totalTips / Math.max(j.shiftCount, 1);
        const avgTipsPerShift = j.totalTips / j.shiftCount;
        const tipOutBurdenPct =
          j.totalGross > 0 ? (j.totalTipOut / j.totalGross) * 100 : 0;

        return {
          ...j,
          wageEarnings,
          totalTakeHome,
          effectiveHourly,
          avgTipsPerShift,
          tipOutBurdenPct,
        };
      })
      .sort((a, b) => b.effectiveHourly - a.effectiveHourly);

    // ─── 4. LAST 7 DAYS CHART ────────────────────────────────────────────────
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const label = format(subDays(new Date(), 6 - i), 'EEE');
      const total = shifts.filter((s) => s.date === date).reduce((s, sh) => s + sh.net_tips, 0);
      return { label, total, date };
    });

    return {
      totalTips,
      totalGross,
      totalCash,
      totalCredit,
      totalTipOut,
      totalHours,
      avgPerShift,
      avgPerHour,
      bestDay,
      dayOfWeekData,
      last7Days,
      jobStats,
    };
  }, [shifts, jobs]);

  // Golden Shift calculations
  const bestHourlyDay = useMemo(() => {
    if (stats.dayOfWeekData.length === 0) return null;
    const sorted = [...stats.dayOfWeekData].filter((d) => d.count > 0).sort((a, b) => b.avgHourly - a.avgHourly);
    return sorted[0] || null;
  }, [stats.dayOfWeekData]);

  const maxLast7 = Math.max(...stats.last7Days.map((d) => d.total), 1);
  const maxDOWHourly = Math.max(...stats.dayOfWeekData.map((d) => d.avgHourly), 1);
  const maxDOWTips = Math.max(...stats.dayOfWeekData.map((d) => d.avgTips), 1);

  // Cash vs Credit %
  const totalMoney = stats.totalCash + stats.totalCredit;
  const cashPct = totalMoney > 0 ? Math.round((stats.totalCash / totalMoney) * 100) : 0;
  const creditPct = totalMoney > 0 ? 100 - cashPct : 0;

  // Pro Calculations
  const tipOutPercentage = stats.totalGross > 0 ? ((stats.totalTipOut / stats.totalGross) * 100).toFixed(1) : '0';
  const estimated2026TaxSaved = Math.round(stats.totalTips * 0.153); // 15.3% FICA/Federal estimated exemption
  const recommendedTaxSetAside = Math.round(tipCalculator.calcEstimatedTax(stats.totalTips));
  const recentVelocityAvg = stats.avgPerShift;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>📊 Shift Intelligence</Text>
          {isPro ? (
            <View style={styles.proBadgeActive}>
              <Text style={styles.proBadgeTextActive}>👑 PRO UNLOCKED</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.proBadgeUpgrade}
              onPress={() => setIsPaywallVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.proBadgeTextUpgrade}>⭐ UPGRADE PRO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── SUMMARY CARDS ─── */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Net Tips</Text>
            <Text style={styles.summaryValue}>{tipCalculator.formatCurrency(stats.totalTips)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>True Hourly Rate</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accent }]}>
              ${stats.avgPerHour.toFixed(2)}/hr
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Per Shift</Text>
            <Text style={styles.summaryValue}>{tipCalculator.formatCurrency(stats.avgPerShift)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Best Shift Record</Text>
            <Text style={[styles.summaryValue, { color: '#00E676' }]}>
              {tipCalculator.formatCurrency(stats.bestDay)}
            </Text>
          </View>
        </View>

        {/* ─── FEATURE #1: 🏆 "GOLDEN SHIFT" MATRIX & SHIFT TRADE ADVISOR ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>🏆 "Golden Shift" Matrix</Text>
              <Text style={styles.cardSubtitle}>
                Discover your highest-earning days & strategic shift trades
              </Text>
            </View>

            {/* Matrix View Toggle */}
            <View style={styles.miniToggle}>
              <TouchableOpacity
                style={[styles.miniToggleBtn, activeMatrixTab === 'hourly' && styles.miniToggleBtnActive]}
                onPress={() => setActiveMatrixTab('hourly')}
              >
                <Text
                  style={[
                    styles.miniToggleText,
                    activeMatrixTab === 'hourly' && styles.miniToggleTextActive,
                  ]}
                >
                  $/hr
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniToggleBtn, activeMatrixTab === 'tips' && styles.miniToggleBtnActive]}
                onPress={() => setActiveMatrixTab('tips')}
              >
                <Text
                  style={[
                    styles.miniToggleText,
                    activeMatrixTab === 'tips' && styles.miniToggleTextActive,
                  ]}
                >
                  $/Shift
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Golden Shift Insight Banner */}
          {bestHourlyDay && bestHourlyDay.avgHourly > 0 && (
            <LinearGradient
              colors={['rgba(255, 209, 102, 0.15)', 'rgba(255, 209, 102, 0.05)']}
              style={styles.goldenInsightCard}
            >
              <Text style={styles.goldenCrown}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goldenTitle}>
                  Your Golden Shift is <Text style={{ color: COLORS.accent }}>{bestHourlyDay.fullName}</Text>!
                </Text>
                <Text style={styles.goldenDesc}>
                  You earn an average of{' '}
                  <Text style={{ fontWeight: '800', color: COLORS.accent }}>
                    ${bestHourlyDay.avgHourly.toFixed(2)}/hr
                  </Text>{' '}
                  on {bestHourlyDay.fullName}s ({bestHourlyDay.count} shifts logged). If trading or picking up shifts, prioritize {bestHourlyDay.fullName}!
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Day-of-Week Interactive Bar Chart */}
          <View style={styles.barChart}>
            {stats.dayOfWeekData.map((d) => {
              const value = activeMatrixTab === 'hourly' ? d.avgHourly : d.avgTips;
              const maxVal = activeMatrixTab === 'hourly' ? maxDOWHourly : maxDOWTips;
              const barHeight = maxVal > 0 ? Math.max((value / maxVal) * 110, value > 0 ? 8 : 0) : 0;
              const isBest = bestHourlyDay?.label === d.label && value > 0;

              return (
                <View key={d.label} style={styles.barColumn}>
                  <Text style={[styles.barValue, isBest && { color: COLORS.accent, fontWeight: '800' }]}>
                    {value > 0 ? `$${Math.round(value)}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: isBest
                            ? COLORS.accent
                            : value > 0
                            ? COLORS.primary
                            : COLORS.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isBest && styles.barLabelBest]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── FEATURE #2: ⚔️ WORKPLACE HEAD-TO-HEAD ROI (MULTI-JOB COMPARISON) ─── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚔️ Workplace ROI Comparison</Text>
          <Text style={styles.cardSubtitle}>
            Head-to-head earnings & take-home efficiency across your jobs
          </Text>

          {stats.jobStats.length === 0 ? (
            <Text style={styles.emptyCardText}>Log shifts with your workplaces to view ROI comparison.</Text>
          ) : (
            <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
              {stats.jobStats.map((job, idx) => {
                const isWinner = idx === 0 && stats.jobStats.length > 1;
                return (
                  <View
                    key={job.jobId}
                    style={[
                      styles.jobRoiCard,
                      isWinner && styles.jobRoiCardWinner,
                    ]}
                  >
                    <View style={styles.jobRoiHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                        <View style={[styles.jobDot, { backgroundColor: job.color }]} />
                        <Text style={styles.jobName}>{job.jobName}</Text>
                        {isWinner && (
                          <View style={styles.winnerBadge}>
                            <Text style={styles.winnerBadgeText}>🥇 HIGHEST ROI</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.jobEffectiveHourly}>
                        ${job.effectiveHourly.toFixed(2)}
                        <Text style={styles.perHourSub}>/hr</Text>
                      </Text>
                    </View>

                    <View style={styles.jobMetricsRow}>
                      <View style={styles.jobMetricItem}>
                        <Text style={styles.jobMetricLabel}>Total Net</Text>
                        <Text style={styles.jobMetricValue}>
                          {tipCalculator.formatCurrency(job.totalTips)}
                        </Text>
                      </View>
                      <View style={styles.jobMetricItem}>
                        <Text style={styles.jobMetricLabel}>Avg / Shift</Text>
                        <Text style={styles.jobMetricValue}>
                          {tipCalculator.formatCurrency(job.avgTipsPerShift)}
                        </Text>
                      </View>
                      <View style={styles.jobMetricItem}>
                        <Text style={styles.jobMetricLabel}>Hours</Text>
                        <Text style={styles.jobMetricValue}>{job.totalHours.toFixed(1)}h</Text>
                      </View>
                      <View style={styles.jobMetricItem}>
                        <Text style={styles.jobMetricLabel}>Tip-Out %</Text>
                        <Text style={styles.jobMetricValue}>{job.tipOutBurdenPct.toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {stats.jobStats.length > 1 && (
                <View style={styles.jobVerdictBanner}>
                  <Text style={styles.jobVerdictText}>
                    💡 <Text style={{ fontWeight: '800', color: COLORS.accent }}>{stats.jobStats[0].jobName}</Text> pays you{' '}
                    <Text style={{ fontWeight: '800', color: '#00E676' }}>
                      {(
                        ((stats.jobStats[0].effectiveHourly - stats.jobStats[1].effectiveHourly) /
                          Math.max(stats.jobStats[1].effectiveHourly, 1)) *
                        100
                      ).toFixed(0)}
                      % more
                    </Text>{' '}
                    per hour than {stats.jobStats[1].jobName}.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── FEATURE #3: 💵 CASH IN POCKET VS. CREDIT TIP PAYCHECK TRACKER ─── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💵 Cash in Pocket vs. Credit Paycheck</Text>
          <Text style={styles.cardSubtitle}>
            Track instant cash take-home vs. credit tips coming on your paycheck
          </Text>

          <View style={styles.cashCardVisual}>
            {/* Visual Split Bar */}
            <View style={styles.splitBar}>
              <View style={[styles.splitFillCash, { width: `${Math.max(cashPct, 5)}%` }]} />
              <View style={[styles.splitFillCredit, { width: `${Math.max(creditPct, 5)}%` }]} />
            </View>

            {/* Split Stats Breakdown */}
            <View style={styles.splitStatsRow}>
              <View style={styles.splitStatBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.splitIndicator, { backgroundColor: '#00E676' }]} />
                  <Text style={styles.splitStatTitle}>Cash in Pocket</Text>
                </View>
                <Text style={styles.splitStatAmount}>
                  {tipCalculator.formatCurrency(stats.totalCash)}
                </Text>
                <Text style={styles.splitStatPct}>{cashPct}% of all tips</Text>
              </View>

              <View style={styles.splitDivider} />

              <View style={styles.splitStatBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.splitIndicator, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.splitStatTitle}>Credit Tips (Paycheck)</Text>
                </View>
                <Text style={styles.splitStatAmount}>
                  {tipCalculator.formatCurrency(stats.totalCredit)}
                </Text>
                <Text style={styles.splitStatPct}>{creditPct}% of all tips</Text>
              </View>
            </View>

            {/* Paycheck Tip Notice */}
            <View style={styles.paycheckNote}>
              <Text style={styles.paycheckNoteText}>
                💳 <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Paycheck Note:</Text>{' '}
                Credit tips are typically deposited on your designated Pay Day.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── PRO INTELLIGENCE SUITE (#4, #5, #6) ─── */}
        <View style={styles.proCardContainer}>
          <LinearGradient
            colors={isPro ? ['#1A202C', '#121620'] : ['#1E2330', '#151922']}
            style={styles.proGradientCard}
          >
            <View style={styles.proHeader}>
              <View>
                <Text style={styles.proSuiteTitle}>⭐ Pro Intelligence Suite</Text>
                <Text style={styles.proSuiteSubtitle}>
                  Advanced tip leakage, 2026 tax relief & goal velocity
                </Text>
              </View>
              {isPro ? (
                <View style={styles.proActiveTag}>
                  <Text style={styles.proActiveTagText}>ACTIVE</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.unlockProBtn}
                  onPress={() => setIsPaywallVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.unlockProBtnText}>Unlock Pro 🚀</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* PRO FEATURE #4: Tip-Out Expense & Leakage Tracker */}
            <View style={styles.proFeatureSection}>
              <View style={styles.proFeatureHeader}>
                <Text style={styles.proFeatureEmoji}>💸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proFeatureTitle}>#4 Tip-Out & Leakage Analyzer</Text>
                  <Text style={styles.proFeatureDesc}>
                    Total money tipped out to bussers, barbacks, and runners
                  </Text>
                </View>
              </View>

              <View style={styles.proStatRow}>
                <View style={styles.proStatBox}>
                  <Text style={styles.proStatLabel}>Total Tipped Out</Text>
                  <Text style={[styles.proStatValue, { color: '#FF6B6B' }]}>
                    {tipCalculator.formatCurrency(stats.totalTipOut)}
                  </Text>
                </View>
                <View style={styles.proStatBox}>
                  <Text style={styles.proStatLabel}>Tip-Out Burden</Text>
                  <Text style={styles.proStatValue}>{tipOutPercentage}% of gross</Text>
                </View>
                <View style={styles.proStatBox}>
                  <Text style={styles.proStatLabel}>Avg per Shift</Text>
                  <Text style={styles.proStatValue}>
                    {tipCalculator.formatCurrency(stats.totalTipOut / Math.max(shifts.length, 1))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.proDivider} />

            {/* PRO FEATURE #5: Live 2026 "No Tax on Tips" IRS Savings Gauge */}
            <View style={styles.proFeatureSection}>
              <View style={styles.proFeatureHeader}>
                <Text style={styles.proFeatureEmoji}>🏛️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proFeatureTitle}>#5 2026 "No Tax on Tips" Savings Gauge</Text>
                  <Text style={styles.proFeatureDesc}>
                    Live estimated tax relief & quarterly set-aside tracker
                  </Text>
                </View>
              </View>

              <View style={styles.taxSavingsBanner}>
                <View>
                  <Text style={styles.taxSavingsLabel}>Est. 2026 Federal Tax Relief</Text>
                  <Text style={styles.taxSavingsAmount}>
                    +{tipCalculator.formatCurrency(estimated2026TaxSaved)}
                  </Text>
                </View>
                <View style={styles.taxBadge}>
                  <Text style={styles.taxBadgeText}>TAX EXEMPT GAUGE</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs }}>
                <Text style={styles.taxSetAsideText}>
                  Quarterly Tax Set-Aside Recommended:{' '}
                  <Text style={{ fontWeight: '800', color: COLORS.accent }}>
                    {tipCalculator.formatCurrency(recommendedTaxSetAside / 4)}/qtr
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.proDivider} />

            {/* PRO FEATURE #6: Goal Pace & Hustle Velocity Predictor */}
            <View style={styles.proFeatureSection}>
              <View style={styles.proFeatureHeader}>
                <Text style={styles.proFeatureEmoji}>🚀</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proFeatureTitle}>#6 Goal Pace & Hustle Velocity</Text>
                  <Text style={styles.proFeatureDesc}>
                    Predicts your milestone dates based on current shift pace
                  </Text>
                </View>
              </View>

              <View style={styles.velocityCard}>
                <Text style={styles.velocityTitle}>Current Velocity: ${Math.round(recentVelocityAvg)}/shift</Text>
                <Text style={styles.velocityDesc}>
                  At your current pace of {shifts.length > 0 ? (shifts.length / 4).toFixed(1) : 3} shifts/week, you are on track to stack{' '}
                  <Text style={{ fontWeight: '800', color: '#00E676' }}>
                    {tipCalculator.formatCurrency(stats.totalTips * 1.25 || 2500)}
                  </Text>{' '}
                  over the next 30 days!
                </Text>
              </View>
            </View>

            {!isPro && (
              <TouchableOpacity
                style={styles.proOverlayCta}
                onPress={() => setIsPaywallVisible(true)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={COLORS.gradientGold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proCtaGradient}
                >
                  <Text style={styles.proCtaText}>👑 Upgrade to Pro — Unlock Full Intelligence Suite</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* ─── CSV & TAX EXPORT CTA ─── */}
        <TouchableOpacity
          style={styles.exportCard}
          onPress={() => setIsExportModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <Text style={{ fontSize: 32 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportCardTitle}>Export Shifts & Tax Spreadsheets</Text>
              <Text style={styles.exportCardSubtitle}>
                Download standard CSV shift logs & full 2026 tax-ready summaries.
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: COLORS.accent, fontWeight: '800' }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* AdMob Banner for Free Tier */}
        <AdBanner />

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Pro Paywall Modal */}
      <ProPaywallModal
        visible={isPaywallVisible}
        onClose={() => setIsPaywallVisible(false)}
      />

      {/* CSV & Tax Export Modal */}
      <ExportTaxModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        onOpenPaywall={() => {
          setIsExportModalVisible(false);
          setIsPaywallVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  proBadgeActive: {
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  proBadgeTextActive: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accent,
  },
  proBadgeUpgrade: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  proBadgeTextUpgrade: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  miniToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm - 2,
  },
  miniToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  miniToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  miniToggleTextActive: {
    color: '#0D0F14',
    fontWeight: '900',
  },
  goldenInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '66',
    marginBottom: SPACING.base,
  },
  goldenCrown: {
    fontSize: 28,
  },
  goldenTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  goldenDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingTop: SPACING.base,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  barValue: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  barTrack: {
    width: '55%',
    height: 110,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  barLabelBest: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  emptyCardText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
  },
  jobRoiCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobRoiCardWinner: {
    borderColor: COLORS.accent + '88',
    backgroundColor: 'rgba(255, 209, 102, 0.05)',
  },
  jobRoiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  jobDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jobName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  winnerBadge: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  winnerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accent,
  },
  jobEffectiveHourly: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#00E676',
  },
  perHourSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  jobMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.xs,
  },
  jobMetricItem: {
    alignItems: 'center',
  },
  jobMetricLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  jobMetricValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  jobVerdictBanner: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobVerdictText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cashCardVisual: {
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  splitBar: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  splitFillCash: {
    backgroundColor: '#00E676',
    height: '100%',
  },
  splitFillCredit: {
    backgroundColor: COLORS.primary,
    height: '100%',
  },
  splitStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  splitIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  splitStatTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  splitStatAmount: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  splitStatPct: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  splitDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  paycheckNote: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  paycheckNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  proCardContainer: {
    marginBottom: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  proGradientCard: {
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  proSuiteTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.accent,
  },
  proSuiteSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  proActiveTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  proActiveTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0F14',
  },
  unlockProBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  unlockProBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    color: '#0D0F14',
  },
  proFeatureSection: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  proFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  proFeatureEmoji: {
    fontSize: 22,
  },
  proFeatureTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  proFeatureDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  proStatRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  proStatBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  proStatLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  proStatValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  proDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  taxSavingsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: '#00E676',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  taxSavingsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  taxSavingsAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: '#00E676',
    marginTop: 2,
  },
  taxBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  taxBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0F14',
  },
  taxSetAsideText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  velocityCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  velocityTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.accent,
  },
  velocityDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  proOverlayCta: {
    marginTop: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  proCtaGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  proCtaText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    color: '#0D0F14',
    letterSpacing: 0.3,
  },
  exportCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary + '44',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginTop: SPACING.xs,
  },
  exportCardTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  exportCardSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
});
