import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useShiftStore, useJobStore, useGamificationStore } from '../../src/store';
import { authService, jobService, profileService, tipCalculator } from '../../src/services/api';
import { getLevelForEarnings } from '../../src/utils/gamification';
import { DAYS_OF_WEEK, getPayPeriodEndDay } from '../../src/utils/payPeriod';
import ProPaywallModal from '../../src/components/ProPaywallModal';
import ExportTaxModal from '../../src/components/ExportTaxModal';
import LegalViewerModal from '../../src/components/LegalViewerModal';
import NotificationSettingsModal from '../../src/components/NotificationSettingsModal';
import ThemeSelectorModal from '../../src/components/ThemeSelectorModal';
import SecurityModal from '../../src/components/SecurityModal';
import ReferralModal from '../../src/components/ReferralModal';
import ImportMigrateModal from '../../src/components/ImportMigrateModal';
import { useThemeStore } from '../../src/store/themeStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';
import { Database } from '../../src/types/database';

type Job = Database['public']['Tables']['jobs']['Row'];

const COLOR_PRESETS = [
  '#00C9A7', // Teal
  '#FFD166', // Gold
  '#FF6B6B', // Coral
  '#6C5CE7', // Purple
  '#0984E3', // Blue
  '#00B894', // Mint
];

function SettingRow({
  label,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  chevron = true,
  color,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  chevron?: boolean;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={toggle || !onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingLabel, color ? { color } : undefined]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {chevron && <Text style={styles.chevron}>›</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Job Edit / Add Modal ──────────────────────────────────────────────────────
interface JobModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
}

function JobModal({ visible, job, onClose, onSaved }: JobModalProps) {
  const { session } = useAuthStore();
  const { addJob, updateJob, removeJob } = useJobStore();

  const [name, setName] = useState(job?.name ?? '');
  const [role, setRole] = useState(job?.role ?? '');
  const [wage, setWage] = useState(job?.hourly_wage?.toString() ?? '');
  const [tipOut, setTipOut] = useState(job?.tip_out_percent?.toString() ?? '');
  const [selectedColor, setSelectedColor] = useState(job?.color ?? COLOR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state whenever modal opens or job changes
  const isEditing = !!job;

  const handleSave = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter a workplace name.');
      return;
    }
    if (!session?.user?.id) {
      setErrorMsg('User not signed in.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedWage = parseFloat(wage) || 0;
      const parsedTipOut = parseFloat(tipOut) || 0;

      if (isEditing && job) {
        const { data, error } = await jobService.updateJob(job.id, {
          name: name.trim(),
          role: role.trim() || null,
          hourly_wage: parsedWage,
          tip_out_percent: parsedTipOut,
          color: selectedColor,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          updateJob(job.id, data);
          onSaved();
          onClose();
        }
      } else {
        const { data, error } = await jobService.createJob({
          user_id: session.user.id,
          name: name.trim(),
          role: role.trim() || null,
          hourly_wage: parsedWage,
          tip_out_percent: parsedTipOut,
          color: selectedColor,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          addJob(data as any);
          onSaved();
          onClose();
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error saving workplace.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    
    const confirmDelete = () => {
      setIsSaving(true);
      jobService.deleteJob(job.id).then(({ error }) => {
        setIsSaving(false);
        if (error) {
          setErrorMsg(error.message);
        } else {
          removeJob(job.id);
          onSaved();
          onClose();
        }
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove "${job.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Workplace',
        `Are you sure you want to remove "${job.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>
            {isEditing ? '✏️ Edit Workplace' : '➕ Add Workplace'}
          </Text>

          {errorMsg ? (
            <View style={modalStyles.errorBox}>
              <Text style={modalStyles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Workplace / Business Name</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. Olive Garden, Main Bar"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Your Role (Optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. Lead Bartender, Server"
              placeholderTextColor={COLORS.textMuted}
              value={role}
              onChangeText={setRole}
            />
          </View>

          <View style={modalStyles.row}>
            <View style={[modalStyles.inputGroup, { flex: 1 }]}>
              <Text style={modalStyles.label}>Base Wage ($/hr)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="5.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={wage}
                onChangeText={setWage}
              />
            </View>
            <View style={[modalStyles.inputGroup, { flex: 1 }]}>
              <Text style={modalStyles.label}>Tip-Out % (Auto)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="3.0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={tipOut}
                onChangeText={setTipOut}
              />
            </View>
          </View>

          {/* Color Selector */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Badge Color</Text>
            <View style={modalStyles.colorRow}>
              {COLOR_PRESETS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    modalStyles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && modalStyles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[modalStyles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color="#0D0F14" />
            ) : (
              <Text style={modalStyles.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Create Workplace'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete Button (if editing) */}
          {isEditing && (
            <TouchableOpacity
              style={modalStyles.deleteBtn}
              onPress={handleDelete}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.deleteBtnText}>Delete Workplace</Text>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { session, profile, setProfile, clear } = useAuthStore();
  const { theme } = useThemeStore();
  const { shifts } = useShiftStore();
  const { jobs, setJobs } = useJobStore();
  const { currentStreak } = useGamificationStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Theme Modal State
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

  // Security Modal State
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);

  // Referral Modal State
  const [isReferralVisible, setIsReferralVisible] = useState(false);

  // Migrate Modal State
  const [isMigrateModalVisible, setIsMigrateModalVisible] = useState(false);

  // Job Modal State
  const [isJobModalVisible, setIsJobModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Name Modal State
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const isPro = profile?.subscription_tier === 'pro';
  const totalEarnings = shifts.reduce((s, sh) => s + sh.net_tips, 0);
  const levelInfo = getLevelForEarnings(totalEarnings);

  const rawName =
    profile?.username ||
    session?.user?.user_metadata?.username ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    (session?.user?.email ? session.user.email.split('@')[0] : '') ||
    'Hustler';

  const username = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Pay Schedule Modal State
  const [isPayScheduleModalVisible, setIsPayScheduleModalVisible] = useState(false);
  const [selectedStartDay, setSelectedStartDay] = useState(profile?.pay_period_start_day ?? 3);
  const [selectedPayDay, setSelectedPayDay] = useState(profile?.pay_day ?? 5);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Pro Paywall & Export Modals
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [legalModal, setLegalModal] = useState<{ visible: boolean; type: 'terms' | 'privacy' }>({
    visible: false,
    type: 'terms',
  });

  const startDayObj = DAYS_OF_WEEK[profile?.pay_period_start_day ?? 3] ?? DAYS_OF_WEEK[3];
  const endDayObj = getPayPeriodEndDay(profile?.pay_period_start_day ?? 3);
  const payDayObj = DAYS_OF_WEEK[profile?.pay_day ?? 5] ?? DAYS_OF_WEEK[5];

  const handleOpenAddJob = () => {
    if (!isPro && jobs.length >= 2) {
      setIsPaywallVisible(true);
      return;
    }
    setEditingJob(null);
    setIsJobModalVisible(true);
  };

  const handleOpenEditJob = (job: Job) => {
    setEditingJob(job);
    setIsJobModalVisible(true);
  };

  const refreshJobs = async () => {
    if (!session?.user?.id) return;
    const freshJobs = await jobService.getJobs(session.user.id);
    setJobs(freshJobs);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !session?.user?.id) return;
    setIsSavingName(true);
    const { data } = await profileService.updateProfile(session.user.id, {
      username: nameInput.trim(),
    });
    if (data) {
      setProfile(data);
    }
    setIsSavingName(false);
    setIsNameModalVisible(false);
  };

  const handleSavePaySchedule = async () => {
    if (!session?.user?.id) return;
    setIsSavingSchedule(true);
    const { data } = await profileService.updateProfile(session.user.id, {
      pay_period_start_day: selectedStartDay,
      pay_day: selectedPayDay,
    });
    if (data) {
      setProfile(data);
    }
    setIsSavingSchedule(false);
    setIsPayScheduleModalVisible(false);
  };

  const handleSignOut = () => {
    const doSignOut = async () => {
      await authService.signOut();
      clear();
      router.replace('/onboarding');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        doSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
      ]);
    }
  };

  const handleUpgrade = () => {
    setIsPaywallVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient colors={COLORS.gradientPrimary} style={styles.profileCard}>
          <TouchableOpacity
            onPress={() => {
              setNameInput(username);
              setIsNameModalVisible(true);
            }}
            style={styles.avatarCircle}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setNameInput(username);
              setIsNameModalVisible(true);
            }}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={styles.profileName}>{username}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>✏️</Text>
          </TouchableOpacity>
          <Text style={styles.profileEmail}>{session?.user.email}</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>
              {isPro ? '⭐ Pro Member' : '🆓 Free Plan'}
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{levelInfo.current.icon} {levelInfo.current.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{currentStreak}🔥</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{tipCalculator.formatCurrency(totalEarnings)}</Text>
            <Text style={styles.statLabel}>All-Time Tips</Text>
          </View>
        </View>

        {/* Upgrade Banner (free users) */}
        {!isPro && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgrade} activeOpacity={0.85}>
            <LinearGradient colors={COLORS.gradientGold} style={styles.upgradeBannerGrad}>
              <Text style={styles.upgradeEmoji}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeSubtitle}>No ads · Unlimited jobs · 14-day free trial</Text>
              </View>
              <Text style={styles.upgradePrice}>$2.99/mo</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Referral Program Banner (All Users) */}
        <TouchableOpacity
          style={styles.referralBannerCard}
          onPress={() => setIsReferralVisible(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FFD166', '#FF9F43', '#00C9A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referralBannerGrad}
          >
            <View style={styles.referralIconCircle}>
              <Text style={{ fontSize: 24 }}>🎁</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={styles.referralCardTitle}>Refer a Fellow TipStacker</Text>
                <View style={styles.referralFreePill}>
                  <Text style={styles.referralFreePillText}>1 MO FREE</Text>
                </View>
              </View>
              <Text style={styles.referralCardSub}>
                Invite another hustler. When they join Pro, you both get 1 month completely free!
              </Text>
            </View>
            <Text style={styles.referralArrowText}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Jobs Section */}
        <Text style={styles.sectionTitle}>My Workplaces ({jobs.length})</Text>
        <View style={styles.section}>
          {jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.settingRow}
              onPress={() => handleOpenEditJob(job)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: job.color || COLORS.primary }} />
                <Text style={styles.settingLabel}>{job.name}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                  {job.role ? `${job.role} · ` : ''}${job.hourly_wage > 0 ? `$${job.hourly_wage}/hr` : 'Tips only'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
          <SettingRow
            label="+ Add a Workplace"
            onPress={handleOpenAddJob}
            color={COLORS.primary}
            chevron={false}
          />
        </View>

        {/* Pay Cycle Settings */}
        <Text style={styles.sectionTitle}>Pay Cycle & Schedule</Text>
        <View style={styles.section}>
          <SettingRow
            label="Pay Period (Week Start)"
            value={`${startDayObj.name}s`}
            onPress={() => {
              setSelectedStartDay(profile?.pay_period_start_day ?? 3);
              setSelectedPayDay(profile?.pay_day ?? 5);
              setIsPayScheduleModalVisible(true);
            }}
          />
          <SettingRow
            label="Pay Period Cycle"
            value={`${startDayObj.short} to ${endDayObj.short}`}
            onPress={() => {
              setSelectedStartDay(profile?.pay_period_start_day ?? 3);
              setSelectedPayDay(profile?.pay_day ?? 5);
              setIsPayScheduleModalVisible(true);
            }}
          />
          <SettingRow
            label="Weekly Pay Day"
            value={`${payDayObj.name}s`}
            onPress={() => {
              setSelectedStartDay(profile?.pay_period_start_day ?? 3);
              setSelectedPayDay(profile?.pay_day ?? 5);
              setIsPayScheduleModalVisible(true);
            }}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <SettingRow
            label="Display Name"
            value={username}
            onPress={() => {
              setNameInput(username);
              setIsNameModalVisible(true);
            }}
          />
          <SettingRow
            label="App Color Theme"
            value={`${theme.emoji} ${theme.name}`}
            onPress={() => setIsThemeModalVisible(true)}
          />
          <SettingRow
            label="Smart Notifications"
            value="Reminders & Alerts"
            onPress={() => setIsNotificationModalVisible(true)}
          />
          <SettingRow
            label="Export Data (CSV & Taxes)"
            value={isPro ? 'Pro Active ⭐' : 'Preview'}
            onPress={() => setIsExportModalVisible(true)}
          />
          <SettingRow
            label="📥 Import & Migrate Shifts"
            value="ServerLife / Excel"
            color={COLORS.primary}
            onPress={() => setIsMigrateModalVisible(true)}
          />
          <SettingRow
            label="Manage Subscription"
            value={isPro ? 'Pro Active ⭐' : 'Upgrade to Pro ($2.99/mo)'}
            onPress={handleUpgrade}
          />
        </View>

        {/* Security & Data Privacy Section */}
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <TouchableOpacity
          style={styles.securityBannerCard}
          onPress={() => setIsSecurityModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={styles.securityBannerLeft}>
            <View style={styles.securityShieldWrap}>
              <Text style={{ fontSize: 20 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.securityBannerTitle}>Bank-Grade 256-Bit Protection</Text>
                <View style={styles.securedBadge}>
                  <Text style={styles.securedBadgeText}>ENCRYPTED</Text>
                </View>
              </View>
              <Text style={styles.securityBannerSubtitle}>
                Your earnings & tips are cryptographically shielded. Only you can view your data.
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <SettingRow
            label="Security & Data Encryption Details"
            value="TLS 1.3 • RLS 🔒"
            onPress={() => setIsSecurityModalVisible(true)}
          />
          <SettingRow
            label="Privacy Policy"
            onPress={() => setLegalModal({ visible: true, type: 'privacy' })}
          />
          <SettingRow
            label="Terms of Service"
            onPress={() => setLegalModal({ visible: true, type: 'terms' })}
          />
          <SettingRow label="US Only — v1.0.0" chevron={false} color={COLORS.textMuted} />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer Copyright */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Johnson Enterprise Tech, LLC
          </Text>
          <Text style={styles.footerSubText}>All rights reserved. Made for hustlers.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Job Modal */}
      {isJobModalVisible && (
        <JobModal
          visible={isJobModalVisible}
          job={editingJob}
          onClose={() => setIsJobModalVisible(false)}
          onSaved={refreshJobs}
        />
      )}

      {/* Edit Name Modal */}
      <Modal visible={isNameModalVisible} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>✏️ Edit Your Name</Text>
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Your Name</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[modalStyles.saveBtn, isSavingName && { opacity: 0.6 }]}
              onPress={handleSaveName}
              disabled={isSavingName}
              activeOpacity={0.85}
            >
              {isSavingName ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={modalStyles.saveBtnText}>Save Name</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsNameModalVisible(false)} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pay Period & Pay Day Schedule Modal */}
      <Modal visible={isPayScheduleModalVisible} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>📅 Pay Period & Pay Day</Text>

            {/* Pay Period Start Day */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Pay Period Week Starts On:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedStartDay === day.value;
                  return (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        {
                          backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceElevated,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: RADIUS.md,
                          borderWidth: 1,
                          borderColor: isSelected ? COLORS.primary : COLORS.border,
                        },
                      ]}
                      onPress={() => setSelectedStartDay(day.value)}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#0D0F14' : COLORS.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: FONT_SIZES.sm,
                        }}
                      >
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ backgroundColor: COLORS.surfaceElevated, padding: 10, borderRadius: RADIUS.md, marginTop: 6, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
                  🗓️ Cycle: {DAYS_OF_WEEK[selectedStartDay].name}s through {getPayPeriodEndDay(selectedStartDay).name}s
                </Text>
              </View>
            </View>

            {/* Weekly Pay Day */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Weekly Pay Day:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedPayDay === day.value;
                  return (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        {
                          backgroundColor: isSelected ? COLORS.accent : COLORS.surfaceElevated,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: RADIUS.md,
                          borderWidth: 1,
                          borderColor: isSelected ? COLORS.accent : COLORS.border,
                        },
                      ]}
                      onPress={() => setSelectedPayDay(day.value)}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#0D0F14' : COLORS.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: FONT_SIZES.sm,
                        }}
                      >
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ backgroundColor: COLORS.surfaceElevated, padding: 10, borderRadius: RADIUS.md, marginTop: 6, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '600' }}>
                  💰 Pay Day occurs every {DAYS_OF_WEEK[selectedPayDay].name}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[modalStyles.saveBtn, isSavingSchedule && { opacity: 0.6 }]}
              onPress={handleSavePaySchedule}
              disabled={isSavingSchedule}
              activeOpacity={0.85}
            >
              {isSavingSchedule ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={modalStyles.saveBtnText}>Save Pay Schedule</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsPayScheduleModalVisible(false)} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        onOpenMigrate={() => {
          setIsExportModalVisible(false);
          setIsMigrateModalVisible(true);
        }}
      />

      {/* In-App Terms & Privacy Viewer */}
      <LegalViewerModal
        visible={legalModal.visible}
        type={legalModal.type}
        onClose={() => setLegalModal({ ...legalModal, visible: false })}
      />

      {/* Smart Notifications Settings Modal */}
      <NotificationSettingsModal
        visible={isNotificationModalVisible}
        onClose={() => setIsNotificationModalVisible(false)}
      />

      {/* App Color Theme Selector Modal */}
      <ThemeSelectorModal
        visible={isThemeModalVisible}
        onClose={() => setIsThemeModalVisible(false)}
      />

      {/* Security & Data Privacy Modal */}
      <SecurityModal
        visible={isSecurityModalVisible}
        onClose={() => setIsSecurityModalVisible(false)}
      />

      {/* Member Referral Modal */}
      <ReferralModal
        visible={isReferralVisible}
        onClose={() => setIsReferralVisible(false)}
      />

      {/* CSV & Excel Data Migration Modal */}
      <ImportMigrateModal
        visible={isMigrateModalVisible}
        onClose={() => setIsMigrateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  profileCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.glow,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: '#FFF' },
  profileName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  profileEmail: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.75)', marginBottom: SPACING.sm },
  profileBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  profileBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#FFF' },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  upgradeBanner: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.base },
  upgradeBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  upgradeEmoji: { fontSize: 28 },
  upgradeTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: '#0D0F14' },
  upgradeSubtitle: { fontSize: FONT_SIZES.xs, color: '#0D0F14', opacity: 0.75 },
  upgradePrice: { fontSize: FONT_SIZES.base, fontWeight: '900', color: '#0D0F14' },
  referralBannerCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  referralBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.md,
  },
  referralIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 15, 20, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralCardTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#0D0F14',
  },
  referralFreePill: {
    backgroundColor: '#0D0F14',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  referralFreePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFD166',
  },
  referralCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(13, 15, 20, 0.85)',
    lineHeight: 15,
  },
  referralArrowText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0D0F14',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
    paddingHorizontal: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: { fontSize: FONT_SIZES.base, color: COLORS.textPrimary, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  settingValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chevron: { fontSize: FONT_SIZES.lg, color: COLORS.textMuted },
  securityBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary + '55',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  securityBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  securityShieldWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBannerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  securityBannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  securedBadge: {
    backgroundColor: COLORS.primary + '33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  securedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  signOutButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '55',
  },
  signOutText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.error },
  footerWrap: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    opacity: 0.7,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
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
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  errorBox: {
    backgroundColor: '#FF6B6B22',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  colorRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#0D0F14',
  },
  deleteBtn: {
    backgroundColor: COLORS.error + '22',
    borderColor: COLORS.error,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.error,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
  },
});
