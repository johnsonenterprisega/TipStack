import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authService, profileService } from '../src/services/api';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store';
import AnimatedSplashScreen from '../src/components/AnimatedSplashScreen';
import { adService } from '../src/services/adService';
import { useThemeStore } from '../src/store/themeStore';
import { emailNotificationService } from '../src/services/emailNotification';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Load saved app color theme
    useThemeStore.getState().loadSavedTheme();

    // Initialize AdMob and Tracking Permissions
    adService.initialize();

    const initAuth = async () => {
      try {
        const { session } = await authService.getSession();
        setSession(session);
        if (session?.user?.id) {
          let prof = await profileService.getProfile(session.user.id);
          const metaName = session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          if (!prof && metaName) {
            await supabase.from('profiles').upsert({ id: session.user.id, username: metaName } as any);
            prof = await profileService.getProfile(session.user.id);
          }
          setProfile(prof);
        }
      } catch (e) {
        console.error('Init auth error:', e);
      } finally {
        setLoading(false);
        setIsAppReady(true);
      }
    };

    initAuth();

        // Listen for auth changes
    const { data: listener } = authService.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        let prof = await profileService.getProfile(session.user.id);
        const metaName = session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (!prof) {
          if (session.user.email) {
            emailNotificationService.notifyOwnerNewSignup({
              email: session.user.email,
              username: metaName || 'Hustler',
            });
          }
          if (metaName) {
            await supabase.from('profiles').upsert({ id: session.user.id, username: metaName } as any);
            prof = await profileService.getProfile(session.user.id);
          }
        }
        setProfile(prof);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>

        {/* Animated Startup Splash Screen */}
        {showSplash && (
          <AnimatedSplashScreen
            isLoading={!isAppReady}
            onFinish={() => setShowSplash(false)}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
