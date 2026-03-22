import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotifications, scheduleDailyPaceCheck } from '../lib/notifications';

function RootLayoutInner() {
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { theme, isDark } = useTheme();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // Check onboarding status on first render
  useEffect(() => {
    AsyncStorage.getItem('@onboarding_done').then((val) => {
      setOnboardingDone(val === 'true');
      setCheckingOnboarding(false);
    });
  }, []);

  // Setup notifications when user logs in
  useEffect(() => {
    if (!user) return;
    setupNotifications().then((granted) => {
      if (granted) {
        const firstName = user.user_metadata?.full_name?.split(' ')[0]
          ?? user.email?.split('@')[0]
          ?? 'there';
        scheduleDailyPaceCheck(user.id, firstName);
      }
    });
  }, [user]);

  useEffect(() => {
    if (loading || checkingOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session) {
      // Not logged in — show onboarding first time, then auth
      if (!onboardingDone && !inOnboarding) {
        router.replace('/onboarding');
      } else if (onboardingDone && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (session) {
      // Logged in — go to tabs
      if (inAuthGroup || inOnboarding) {
        router.replace('/(tabs)');
      }
    }
  }, [session, loading, segments, checkingOnboarding, onboardingDone]);

  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="task/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="task/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="task/submit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recap" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
