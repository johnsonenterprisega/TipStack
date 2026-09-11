import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../../src/services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    const { error } = await authService.signIn(email.trim().toLowerCase(), password);
    setIsLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google');
    const { data, error } = await authService.signInWithGoogle();
    setSocialLoading(null);
    if (error) {
      if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
        Alert.alert(
          'Google Sign-In Needs Activation',
          'Google authentication has not been turned on in your Supabase dashboard yet. Please sign in with email/password or enable the Google provider in Supabase.'
        );
      } else {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    } else if (data?.url) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = data.url;
      } else {
        await WebBrowser.openAuthSessionAsync(data.url, 'tipstack://auth/callback');
      }
    }
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    const { data, error } = await authService.signInWithApple();
    setSocialLoading(null);
    if (error) {
      Alert.alert('Apple Sign-In Failed', error.message);
    } else if (data?.url) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = data.url;
      } else {
        await WebBrowser.openAuthSessionAsync(data.url, 'tipstack://auth/callback');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Earn it. Track it. Stack it.</Text>
          </View>

          {/* Social Buttons */}
          <View style={styles.socialGroup}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogle}
              disabled={!!socialLoading}
              activeOpacity={0.82}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleApple}
                disabled={!!socialLoading}
                activeOpacity={0.82}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.socialIcon}>🍎</Text>
                    <Text style={[styles.socialText, styles.appleText]}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeaderRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/forgot-password',
                      params: { email: email.trim() },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !!socialLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In 💸</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.signupLink}>
              <Text style={styles.signupLinkText}>
                No account yet?{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign Up Free</Text>
              </Text>
            </TouchableOpacity>

            {/* Security Trust Seal */}
            <View style={styles.securityTrustBadge}>
              <Text style={styles.securityTrustText}>
                🔒 256-Bit Encrypted • Zero Bank Logins Required • 100% Private
              </Text>
            </View>

            <Text style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md }}>
              © {new Date().getFullYear()} Johnson Enterprise Tech, LLC
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.xl },
  backButton: { paddingTop: SPACING.base },
  backText: { color: COLORS.primary, fontSize: FONT_SIZES.base },
  header: { paddingTop: SPACING.base, paddingBottom: SPACING.lg, alignItems: 'center' },
  logoImg: { width: 96, height: 96, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2, letterSpacing: -0.5 },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  socialGroup: { gap: SPACING.sm, marginBottom: SPACING.base },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
  },
  appleButton: { backgroundColor: '#FFFFFF' },
  socialIcon: { fontSize: FONT_SIZES.md, fontWeight: '900', color: COLORS.textPrimary },
  socialText: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  appleText: { color: '#000000' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.base },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '500' },
  form: { gap: SPACING.base },
  inputGroup: { gap: SPACING.xs },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  label: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#FFFFFF' },
  signupLink: { alignItems: 'center', paddingVertical: SPACING.sm },
  signupLinkText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.base },
  securityTrustBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  securityTrustText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
