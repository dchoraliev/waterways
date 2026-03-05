import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_PREFIX = 'draftReminder:';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ANDROID_CHANNEL_ID = 'draft-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function reminderKey(tripId: string) {
  return `${REMINDER_PREFIX}${tripId}`;
}

async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    !!requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Draft reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Reminders to review and submit draft journeys.',
  });
}

export async function scheduleDraftReminder(tripId: string, createdAt: number): Promise<void> {
  if (!tripId || tripId === 'sample-trip') return;

  const permitted = await ensurePermissions();
  if (!permitted) return;

  await ensureAndroidChannel();
  await cancelDraftReminder(tripId);

  const now = Date.now();
  const normalizedCreatedAt = createdAt < 10_000_000_000 ? createdAt * 1000 : createdAt;
  const target = Math.max(now + TWO_HOURS_MS, normalizedCreatedAt + TWO_HOURS_MS);
  const delayMs = Math.max(0, target - now);
  const triggerSeconds = Math.max(1, Math.ceil(delayMs / 1000));
  let trigger: Notifications.NotificationTriggerInput;

  if (Platform.OS === 'android') {
    trigger = { seconds: triggerSeconds, channelId: ANDROID_CHANNEL_ID };
  } else {
    const iosTrigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(target),
    };
    trigger = iosTrigger;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Draft journey reminder',
      body: 'You have a draft journey waiting. Review and submit when ready.',
      sound: true,
      data: {
        route: '/drafts',
        tripId,
      },
    },
    trigger,
  });

  await AsyncStorage.setItem(reminderKey(tripId), notificationId);
}

export async function cancelDraftReminder(tripId: string): Promise<void> {
  if (!tripId) return;

  const key = reminderKey(tripId);
  const notificationId = await AsyncStorage.getItem(key);
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await AsyncStorage.removeItem(key);
}

export async function cancelDraftRemindersForTrips(tripIds: string[]): Promise<void> {
  for (const tripId of tripIds) {
    await cancelDraftReminder(tripId);
  }
}
