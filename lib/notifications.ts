/**
 * Feature 6 — Personal Win Notifications
 * Personalized notifications that reference the user's actual data.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function setupNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('accountability', {
      name: 'Accountability Buddy',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return true;
}

export async function scheduleStreakProtectionNotification(
  userId: string,
  firstName: string,
  streak: number
) {
  if (streak === 0) return;

  // Cancel existing streak notifications first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === 'streak_protection') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // Schedule for 8pm today
  const fireDate = new Date();
  fireDate.setHours(20, 0, 0, 0);
  if (fireDate <= new Date()) {
    fireDate.setDate(fireDate.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${firstName}, your streak is on the line 🔥`,
      body: `Your ${streak}-day streak ends at midnight. One task is all it takes.`,
      data: { type: 'streak_protection', userId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
}

export async function sendPersonalRecordNotification(
  firstName: string,
  taskCount: number
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New record, ${firstName}! 🏆`,
      body: `${taskCount} tasks completed today. Screenshot-worthy.`,
      data: { type: 'personal_record' },
    },
    trigger: null, // immediate
  });
}

export async function scheduleDailyPaceCheck(
  userId: string,
  firstName: string
) {
  // Cancel existing
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === 'daily_pace') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // Schedule daily at 6pm
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You're on pace, ${firstName} 🔥`,
      body: `You're on track for your best day this week. Don't stop now.`,
      data: { type: 'daily_pace', userId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });
}

export async function checkAndSendPersonalRecord(
  userId: string,
  firstName: string
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's count
    const { count: todayCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', today.toISOString());

    if (!todayCount || todayCount < 2) return;

    // Get best previous day
    const { data: history } = await supabase
      .from('tasks')
      .select('updated_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('updated_at', today.toISOString());

    if (!history) return;

    const byDay: Record<string, number> = {};
    history.forEach((t) => {
      const day = new Date(t.updated_at).toDateString();
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const maxPrev = Math.max(0, ...Object.values(byDay));
    if (todayCount > maxPrev) {
      await sendPersonalRecordNotification(firstName, todayCount);
    }
  } catch {
    // Silent fail
  }
}
