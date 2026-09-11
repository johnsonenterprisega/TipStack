import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { notificationService, NotificationSettings } from '../services/notifications';
import { adService } from '../services/adService';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../theme';
import { useAuthStore } from '../store';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const POPULAR_TIMES = ['20:00', '21:00', '22:00', '23:00', '00:00'];

const TIME_LABELS: Record<string, string> = {
  '20:00': '8:00 PM',
  '21:00': '9:00 PM',
  '22:00': '10:00 PM (Default)',
  '23:00': '11:00 PM',
  '00:00': 'Midnight',
};

export default function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { profile } = useAuthStore();
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyEnabled: true,
    dailyTime: '22:00',
    payDayEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      notificationService.getSettings().then((s) => setSettings(s));
    }
  }, [visible]);

  const handleToggleDaily = (val: boolean) => {
    setSettings((prev) => ({ ...prev, dailyEnabled: val }));
  };

  const handleTogglePayDay = (val: boolean) => {
    setSettings((prev) => ({ ...prev, payDayEnabled: val }));
  };

  const handleSelectTime = (time: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
    setSettings((prev) => ({ ...prev, dailyTime: time }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payDay = profile?.pay_day ?? 5;
    await notificationService.saveSettings(settings, payDay);
    setIsSaving(false);

    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    onClose();
  };

  const handleTestPing = async (type: 'shift' | 'payday') => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    await notificationService.sendTestNotification(type);
    if (Platform.OS !== 'web') {
      Alert.alert('🔔 Notification Sent', 'Check your notification banner or lock screen!');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>🔔 Smart Notifications</Text>
          <Text style={styles.subtitle}>
            Never lose a shift streak or miss a pay day celebration.
          </Text>

          {/* Daily Shift Reminder Toggle */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Daily Shift Reminder</Text>
              <Text style={styles.settingDesc}>
                Remind you to log cash & credit tips after work.
              </Text>
            </View>
            <Switch
              value={settings.dailyEnabled}
              onValueChange={handleToggleDaily}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Time Picker Chips */}
          {settings.dailyEnabled && (
            <View style={styles.timeSection}>
              <Text style={styles.timeSectionLabel}>Reminder Time</Text>
              <View style={styles.chipsContainer}>
                {POPULAR_TIMES.map((time) => {
                  const isSelected = settings.dailyTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleSelectTime(time)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {TIME_LABELS[time]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Pay Day Alert Toggle */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Weekly Pay Day Celebration</Text>
              <Text style={styles.settingDesc}>
                Get an instant notification on your designated pay day with your weekly stacked earnings.
              </Text>
            </View>
            <Switch
              value={settings.payDayEnabled}
              onValueChange={handleTogglePayDay}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Test Buttons */}
          <View style={styles.testSection}>
            <Text style={styles.testSectionLabel}>Verify Notifications & Ad Delivery</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestPing('shift')}
                activeOpacity={0.8}
              >
                <Text style={styles.testButtonText}>Test Shift Ping 💰</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestPing('payday')}
                activeOpacity={0.8}
              >
                <Text style={styles.testButtonText}>Test Pay Day 🎉</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.testButton, { marginTop: SPACING.sm, backgroundColor: COLORS.surface }]}
              onPress={async () => {
                const shown = await adService.forceShowInterstitial();
                if (!shown && Platform.OS !== 'web') {
                  Alert.alert('🎬 Loading Ad...', 'Google AdMob is fetching the ad. Please tap again in 2 seconds!');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.testButtonText, { color: COLORS.accent }]}>
                Test Full-Screen Interstitial Ad 🎬
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>Save Notification Settings 💾</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  settingLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  settingDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  timeSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeSectionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  testSection: {
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  testSectionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  testButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#0D0F14',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cancelText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
