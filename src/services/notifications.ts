import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEYS = {
  DAILY_ENABLED: '@tipstack_notif_daily_enabled',
  DAILY_TIME: '@tipstack_notif_daily_time', // e.g. "22:00"
  PAYDAY_ENABLED: '@tipstack_notif_payday_enabled',
};

export interface NotificationSettings {
  dailyEnabled: boolean;
  dailyTime: string; // "HH:mm"
  payDayEnabled: boolean;
}

export const notificationService = {
  // Request user permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Could not request notification permissions', e);
      return false;
    }
  },

  // Load saved settings
  async getSettings(): Promise<NotificationSettings> {
    try {
      const dailyEnabled = (await AsyncStorage.getItem(STORAGE_KEYS.DAILY_ENABLED)) ?? 'true';
      const dailyTime = (await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIME)) ?? '22:00';
      const payDayEnabled = (await AsyncStorage.getItem(STORAGE_KEYS.PAYDAY_ENABLED)) ?? 'true';

      return {
        dailyEnabled: dailyEnabled === 'true',
        dailyTime,
        payDayEnabled: payDayEnabled === 'true',
      };
    } catch {
      return { dailyEnabled: true, dailyTime: '22:00', payDayEnabled: true };
    }
  },

  // Save settings and reschedule notifications
  async saveSettings(settings: NotificationSettings, payDayIndex: number = 5): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_ENABLED, settings.dailyEnabled ? 'true' : 'false');
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIME, settings.dailyTime);
      await AsyncStorage.setItem(STORAGE_KEYS.PAYDAY_ENABLED, settings.payDayEnabled ? 'true' : 'false');

      await this.rescheduleAll(settings, payDayIndex);
    } catch (e) {
      console.warn('Failed to save notification settings', e);
    }
  },

  // Reschedule notifications based on active preferences
  async rescheduleAll(settings: NotificationSettings, payDayIndex: number = 5): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      // Clear existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      // 1. Schedule Daily Shift Reminder
      if (settings.dailyEnabled) {
        const [hourStr, minStr] = settings.dailyTime.split(':');
        const hour = parseInt(hourStr, 10) || 22;
        const minute = parseInt(minStr, 10) || 0;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💰 TipStack Reminder',
            body: "Did you work today? Don't forget to log your tips & hours to keep your streak alive!",
            sound: true,
            data: { screen: 'home' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      }

      // 2. Schedule Weekly Pay Day Celebration
      if (settings.payDayEnabled) {
        // Convert payDayIndex (0=Sun, 1=Mon, ..., 6=Sat) to 1-7 for iOS trigger where 1=Sun
        const weekday = payDayIndex + 1;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎉 Happy Pay Day!',
            body: 'Today is your weekly Pay Day! Check your stacked earnings and tax estimates in TipStack.',
            sound: true,
            data: { screen: 'analytics' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: 9,
            minute: 0,
          },
        });
      }
    } catch (e) {
      console.warn('Error rescheduling notifications', e);
    }
  },

  // Trigger test notification immediately for verification
  async sendTestNotification(type: 'shift' | 'payday'): Promise<void> {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(
          type === 'shift' ? '💰 TipStack Reminder' : '🎉 Happy Pay Day!',
          {
            body:
              type === 'shift'
                ? "Did you work today? Don't forget to log your tips and keep your streak alive!"
                : 'Today is Pay Day! Tap to see your stacked earnings for this cycle.',
          }
        );
      } else {
        alert(
          type === 'shift'
            ? "🔔 [TipStack Test] Don't forget to log tonight's shift tips!"
            : '🎉 [TipStack Test] Happy Pay Day! Check your weekly earnings.'
        );
      }
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: type === 'shift' ? '💰 TipStack Reminder' : '🎉 Happy Pay Day!',
          body:
            type === 'shift'
              ? "Did you work today? Don't forget to log your tips and keep your streak alive!"
              : 'Today is Pay Day! Tap to see your stacked earnings for this cycle.',
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      console.warn('Failed to send test notification', e);
    }
  },
};
