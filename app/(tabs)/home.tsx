import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useShiftStore, useJobStore, useGamificationStore } from '../../src/store';
import { shiftService, jobService, profileService, goalService, tipCalculator } from '../../src/services/api';
import { calcStreak, getLevelForEarnings } from '../../src/utils/gamification';
import { getCurrentPayPeriod, getPayDayStatus, DAYS_OF_WEEK } from '../../src/utils/payPeriod';
import ShiftModal from '../../src/components/ShiftModal';
import CelebrationModal, { CelebrationData } from '../../src/components/CelebrationModal';
import ShiftFlexModal from '../../src/components/ShiftFlexModal';
import ImportMigrateModal from '../../src/components/ImportMigrateModal';
import { useAppTheme } from '../../src/store/themeStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';
import { Database } from '../../src/types/database';

type Goal = Database['public']['Tables']['goals']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { session, profile, setProfile } = useAuthStore();
  const { shifts, setShifts, setLoading, isLoading } = useShiftStore();
  const { jobs, setJobs, addJob } = useJobStore();
  const { setStreak, setTotalEarnings, setLevel } = useGamificationStore();
  const { currentStreak, level } = useGamificationStore();

  const [showLogModal, setShowLogModal] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [flexShift, setFlexShift] = useState<Shift | null>(null);
  const [isFlexModalVisible, setIsFlexModalVisible] = useState(false);

  // Earnings Goal State
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isMigrateModalVisible, setIsMigrateModalVisible] = useState(false);
  const [goalTargetInput, setGoalTargetInput] = useState('');
  const [goalType, setGoalType] = useState<'weekly' | 'monthly'>('weekly');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      let [shiftsData, jobsData, profData, goalsData] = await Promise.all([
        shiftService.getShifts(session.user.id, 200),
        jobService.getJobs(session.user.id),
        profileService.getProfile(session.user.id),
        goalService.getGoals(session.user.id),
      ]);

      if (goalsData && goalsData.length > 0) {
        setActiveGoal(goalsData[0]);
        setGoalTargetInput(goalsData[0].target_amount.toString());
        setGoalType(goalsData[0].type === 'monthly' ? 'monthly' : 'weekly');
      }

      if (profData) {
        setProfile(profData);
      } else {
        const metaName = session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (metaName) {
          const { data: createdProf } = await profileService.updateProfile(session.user.id, { username: metaName });
          if (createdProf) setProfile(createdProf);
        }
      }

      // If new user with no jobs, auto-create a starter job
      if (jobsData.length === 0) {
        const { data: newJob } = await jobService.createJob({
          user_id: session.user.id,
          name: 'Primary Job',
          role: 'Server / Bartender',
          hourly_wage: 5.0,
          tip_out_percent: 0,
          color: '#00C9A7',
        });
        if (newJob) {
          jobsData = [newJob];
        }
      }

      setShifts(shiftsData);
      setJobs(jobsData);

      // Update gamification
      const { currentStreak: streak, longestStreak } = calcStreak(shiftsData);
      const total = shiftsData.reduce((sum: number, s: any) => sum + s.net_tips, 0);
      const { current } = getLevelForEarnings(total);
      setStreak(streak, longestStreak);
      setTotalEarnings(total);
      setLevel(current.level);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculated stats
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const payPeriodStartDay = profile?.pay_period_start_day ?? 3; // Wednesday default
  const payDay = profile?.pay_day ?? 5; // Friday default

  const currentPayPeriod = getCurrentPayPeriod(now, payPeriodStartDay);
  const payDayStatus = getPayDayStatus(now, payDay);

  const todayTips = shifts
    .filter((s) => s.date === today)
    .reduce((sum: number, s: any) => sum + s.net_tips, 0);

  const payPeriodTips = shifts
    .filter((s) => s.date >= currentPayPeriod.startDateStr && s.date <= currentPayPeriod.endDateStr)
    .reduce((sum: number, s: any) => sum + s.net_tips, 0);

  const monthTips = shifts
    .filter((s) => s.date >= monthStart && s.date <= monthEnd)
    .reduce((sum: number, s: any) => sum + s.net_tips, 0);

  const recentShifts = shifts.slice(0, 5);

  const levelInfo = getLevelForEarnings(shifts.reduce((sum: number, s: any) => sum + s.net_tips, 0));

  const rawName =
    profile?.username ||
    session?.user?.user_metadata?.username ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    (session?.user?.email ? session.user.email.split('@')[0] : '') ||
    'Hustler';

  const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const firstName = cleanName.split(' ')[0];

  // Goal calculations
  const goalTarget = activeGoal ? activeGoal.target_amount : 0;
  const isMonthlyGoal = activeGoal?.type === 'monthly';
  const currentGoalProgress = isMonthlyGoal ? monthTips : payPeriodTips;
  const goalPercentage = goalTarget > 0 ? Math.min(1, currentGoalProgress / goalTarget) : 0;
  const goalRemaining = Math.max(0, goalTarget - currentGoalProgress);

  const handleSaveGoal = async () => {
    if (!session?.user?.id) return;
    const targetAmount = parseFloat(goalTargetInput);
    if (!targetAmount || targetAmount <= 0) {
      if (Platform.OS === 'web') window.alert('Please enter a target amount.');
      else Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    setIsSavingGoal(true);
    try {
      if (activeGoal) {
        const { data } = await goalService.updateGoal(activeGoal.id, {
          target_amount: targetAmount,
        });
        if (data) setActiveGoal(data);
      } else {
        const { data } = await goalService.saveGoal({
          user_id: session.user.id,
          type: goalType,
          target_amount: targetAmount,
          period_label: goalType === 'monthly' ? format(now, 'MMMM yyyy') : currentPayPeriod.label,
          start_date: goalType === 'monthly' ? monthStart : currentPayPeriod.startDateStr,
          end_date: goalType === 'monthly' ? monthEnd : currentPayPeriod.endDateStr,
          is_active: true,
        });
        if (data) setActiveGoal(data);
      }
      setIsGoalModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save goal.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>
                Hey {firstName} 👋
              </Text>
              <Text style={styles.subGreeting}>Earn it. Track it. Stack it.</Text>
            </View>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{currentStreak}</Text>
          </View>
        </View>

        {/* Quick Log Shift Action Banner */}
        <TouchableOpacity
          style={styles.quickLogBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShiftToEdit(null);
            setShowLogModal(true);
          }}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={colors.gradientGold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickLogGradient}
          >
            <View style={styles.quickLogLeft}>
              <View style={styles.quickLogIconWrap}>
                <Text style={styles.quickLogIcon}>💸</Text>
              </View>
              <View>
                <Text style={styles.quickLogTitle}>Log Today's Shift</Text>
                <Text style={styles.quickLogSubtitle}>Track cash, credit tips & hours</Text>
              </View>
            </View>
            <View style={styles.quickLogBadge}>
              <Text style={styles.quickLogBadgeText}>+ LOG ✏️</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Today Hero Card */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.heroCard}>
          <Text style={styles.heroLabel}>TODAY'S TIPS</Text>
          <Text style={styles.heroAmount}>{tipCalculator.formatCurrency(todayTips)}</Text>
          <Text style={styles.heroSubtext}>
            {shifts.filter((s) => s.date === today).length} shift{shifts.filter((s) => s.date === today).length !== 1 ? 's' : ''} logged
          </Text>
        </LinearGradient>

        {/* Pay Day & Pay Period Info Banner */}
        <View style={[styles.payDayBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.payDayEmoji}>{payDayStatus.isToday ? '🎉' : '💰'}</Text>
            <Text style={[styles.payDayText, { color: colors.accent }]}>{payDayStatus.message}</Text>
          </View>
          <Text style={styles.payPeriodDates}>{currentPayPeriod.label}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Pay Period</Text>
            <Text style={styles.statAmount}>{tipCalculator.formatCurrency(payPeriodTips)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statAmount}>{tipCalculator.formatCurrency(monthTips)}</Text>
          </View>
        </View>

        {/* Earnings Goal Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.goalEmoji}>🎯</Text>
              <View>
                <Text style={styles.goalTitle}>
                  {activeGoal ? (isMonthlyGoal ? 'Monthly Tip Goal' : 'Pay Period Goal') : 'Earnings Goal'}
                </Text>
                <Text style={styles.goalSubtitle}>
                  {activeGoal
                    ? `${tipCalculator.formatCurrency(currentGoalProgress)} of ${tipCalculator.formatCurrency(goalTarget)}`
                    : 'Set a target to keep yourself motivated'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.goalEditBtn}
              onPress={() => {
                if (activeGoal) setGoalTargetInput(activeGoal.target_amount.toString());
                setIsGoalModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.goalEditBtnText}>{activeGoal ? 'Edit' : '+ Set Goal'}</Text>
            </TouchableOpacity>
          </View>

          {activeGoal && (
            <View style={{ marginTop: SPACING.sm }}>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${goalPercentage * 100}%` }]} />
              </View>
              <View style={styles.goalFooter}>
                <Text style={styles.goalFooterText}>
                  {goalPercentage >= 1
                    ? `🎉 Goal Reached! (+${tipCalculator.formatCurrency(currentGoalProgress - goalTarget)})`
                    : `🔥 ${tipCalculator.formatCurrency(goalRemaining)} left to hit target`}
                </Text>
                <Text style={styles.goalPercentBadge}>{Math.round(goalPercentage * 100)}%</Text>
              </View>
            </View>
          )}
        </View>

        {/* Level Progress */}
        <TouchableOpacity
          style={styles.levelCard}
          onPress={() => {
            setCelebrationData({
              type: 'level_up',
              title: `${levelInfo.current.title} (Level ${levelInfo.current.level})`,
              subtitle: `You've stacked your way to ${levelInfo.current.title}! Keep logging shifts to reach ${levelInfo.next?.title || 'The GOAT'}.`,
              emoji: levelInfo.current.icon,
            });
          }}
          activeOpacity={0.85}
        >
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>{levelInfo.current.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{levelInfo.current.title}</Text>
              <Text style={styles.levelSubtitle}>
                {levelInfo.next
                  ? `${tipCalculator.formatCurrency(levelInfo.next.minEarnings - shifts.reduce((s, sh) => s + sh.net_tips, 0))} to ${levelInfo.next.title}`
                  : 'MAX LEVEL 🐐'}
              </Text>
            </View>
            <Text style={styles.levelBadge}>Lv {levelInfo.current.level}</Text>
          </View>
          {levelInfo.next && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelInfo.progress * 100}%` }]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Recent Shifts */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Shifts</Text>
          <Text style={styles.sectionCount}>{shifts.length} total</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : recentShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No shifts logged yet!</Text>
            <Text style={styles.emptySubtitle}>Tap "+ Log Shift" below to record today's earnings.</Text>

            {/* Free Migration Callout */}
            <TouchableOpacity
              style={styles.migrateEmptyBtn}
              onPress={() => setIsMigrateModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 24 }}>📥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.migrateEmptyBtnTitle}>Switching from ServerLife or TipSee?</Text>
                <Text style={styles.migrateEmptyBtnSub}>Tap to migrate your past shifts for free in 1-click!</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 16 }}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentShifts.map((shift) => {
            const job = jobs.find((j) => j.id === shift.job_id);
            return (
              <TouchableOpacity
                key={shift.id}
                style={styles.shiftCard}
                onPress={() => {
                  setShiftToEdit(shift);
                  setShowLogModal(true);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.shiftDot, { backgroundColor: job?.color ?? COLORS.primary }]} />
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftJob}>{job?.name ?? 'Job'}</Text>
                  <Text style={styles.shiftDate}>{format(new Date(shift.date + 'T12:00:00'), 'EEE, MMM d')}</Text>
                </View>
                <View style={styles.shiftRight}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.shiftTips}>{tipCalculator.formatCurrency(shift.net_tips)}</Text>
                    <TouchableOpacity
                      style={styles.flexPill}
                      onPress={(e) => {
                        e.stopPropagation();
                        setFlexShift(shift);
                        setIsFlexModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flexPillText}>📸 Flex</Text>
                    </TouchableOpacity>
                  </View>
                  {shift.hours_worked > 0 && (
                    <Text style={styles.shiftHours}>{shift.hours_worked}h • Tap to edit ✏️</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {recentShifts.length > 0 && (
          <TouchableOpacity
            style={styles.migrateFootBtn}
            onPress={() => setIsMigrateModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.migrateFootBtnText}>
              📥 Switching apps? Import past shifts free from CSV/Excel →
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — Quick Log */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShiftToEdit(null);
          setShowLogModal(true);
        }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={colors.gradientGold} style={styles.fabGradient}>
          <Text style={styles.fabText}>+ Log Shift</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Shift Create / Edit / Delete Modal */}
      <ShiftModal
        visible={showLogModal}
        shiftToEdit={shiftToEdit}
        onClose={() => {
          setShowLogModal(false);
          setShiftToEdit(null);
        }}
        onSaved={loadData}
      />

      {/* Goal Setting Modal */}
      <Modal visible={isGoalModalVisible} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>🎯 Set Earnings Target</Text>
            <Text style={modalStyles.date}>Stay focused and hit your income milestones</Text>

            {/* Goal Type Picker */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.xs }}>
              <TouchableOpacity
                style={[
                  styles.goalTypeChip,
                  goalType === 'weekly' && styles.goalTypeChipActive,
                ]}
                onPress={() => setGoalType('weekly')}
              >
                <Text style={[styles.goalTypeChipText, goalType === 'weekly' && styles.goalTypeChipTextActive]}>
                  📅 This Pay Period
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.goalTypeChip,
                  goalType === 'monthly' && styles.goalTypeChipActive,
                ]}
                onPress={() => setGoalType('monthly')}
              >
                <Text style={[styles.goalTypeChipText, goalType === 'monthly' && styles.goalTypeChipTextActive]}>
                  📆 This Month
                </Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.inputWrap}>
              <Text style={modalStyles.inputLabel}>Target Tip Amount ($)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="e.g. 1000.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={goalTargetInput}
                onChangeText={setGoalTargetInput}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[modalStyles.saveButton, isSavingGoal && { opacity: 0.6 }]}
              onPress={handleSaveGoal}
              disabled={isSavingGoal}
              activeOpacity={0.85}
            >
              {isSavingGoal ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={modalStyles.saveButtonText}>Save Goal 🎯</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsGoalModalVisible(false)} style={modalStyles.cancelButton}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      <CelebrationModal
        visible={!!celebrationData}
        data={celebrationData}
        onClose={() => setCelebrationData(null)}
      />

      {/* Shift Flex Story Generator Modal */}
      <ShiftFlexModal
        visible={isFlexModalVisible}
        shift={flexShift}
        onClose={() => {
          setIsFlexModalVisible(false);
          setFlexShift(null);
        }}
      />

      {/* CSV & Excel Data Migration Modal */}
      <ImportMigrateModal
        visible={isMigrateModalVisible}
        onClose={() => setIsMigrateModalVisible(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  subGreeting: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  headerLogo: { width: 44, height: 44, borderRadius: RADIUS.md },
  streakBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 4,
  },
  streakFire: { fontSize: 20 },
  streakCount: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.accent },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  heroLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  heroAmount: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroSubtext: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: SPACING.xs },
  payDayBanner: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  payDayEmoji: { fontSize: 18 },
  payDayText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.accent },
  payPeriodDates: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', marginBottom: SPACING.xs },
  statAmount: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalEmoji: { fontSize: 24 },
  goalTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  goalSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  goalEditBtn: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  goalEditBtnText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.accent },
  goalProgressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  goalFooterText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  goalPercentBadge: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: COLORS.accent },
  goalTypeChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  goalTypeChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  goalTypeChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  goalTypeChipTextActive: {
    color: '#0D0F14',
    fontWeight: '800',
  },
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  levelIcon: { fontSize: 28 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  levelSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  levelBadge: {
    backgroundColor: COLORS.primary + '22',
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  sectionCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  shiftDot: { width: 10, height: 10, borderRadius: 5 },
  shiftInfo: { flex: 1 },
  shiftJob: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  shiftDate: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  shiftRight: { alignItems: 'flex-end' },
  shiftTips: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.primary },
  shiftHours: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  flexPill: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  flexPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
  },
  quickLogBanner: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  quickLogGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  quickLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  quickLogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 15, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogIcon: {
    fontSize: 22,
  },
  quickLogTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#0D0F14',
    letterSpacing: -0.3,
  },
  quickLogSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(13, 15, 20, 0.75)',
    marginTop: 1,
  },
  quickLogBadge: {
    backgroundColor: '#0D0F14',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  quickLogBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    color: '#FFD166',
    letterSpacing: 0.5,
  },
  emptyState: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  migrateEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#161920',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '55',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    maxWidth: 340,
    ...SHADOWS.sm,
  },
  migrateEmptyBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  migrateEmptyBtnSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  migrateFootBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  migrateFootBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 84,
    right: SPACING.base,
    borderRadius: RADIUS.full,
    ...SHADOWS.glow,
  },
  fabGradient: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  fabText: { fontSize: FONT_SIZES.base, fontWeight: '900', color: '#0D0F14', letterSpacing: 0.3 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    gap: SPACING.base,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  date: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: -SPACING.sm },
  jobScroll: { marginBottom: -SPACING.sm },
  jobChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobChipText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  row: { flexDirection: 'row', gap: SPACING.sm },
  inputWrap: { flex: 1, gap: SPACING.xs },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  netTipsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
  },
  netTipsLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  netTipsAmount: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: '#FFFFFF' },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#0D0F14' },
  cancelButton: { alignItems: 'center', paddingVertical: SPACING.sm },
  cancelText: { color: COLORS.textMuted, fontSize: FONT_SIZES.base },
});
