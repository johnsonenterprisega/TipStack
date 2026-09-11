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
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../src/services/api';
import { emailNotificationService } from '../../src/services/emailNotification';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Missing Info', 'Please enter your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    let surveyData: Record<string, any> = {};
    try {
      const saved = await AsyncStorage.getItem('@tipstack_onboarding_survey');
      if (saved) surveyData = JSON.parse(saved);
    } catch {}
    if (referralCode.trim()) {
      surveyData.referredByCode = referralCode.trim().toUpperCase();
    }
    const { error } = await authService.signUp(email.trim().toLowerCase(), password, name.trim(), surveyData);
    setIsLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      // Fire-and-forget branded email notification to shop owner
      emailNotificationService.notifyOwnerNewSignup({
        email: email.trim().toLowerCase(),
        username: name.trim() || 'Hustler',
      });

      Alert.alert(
        '🎉 Welcome to TipStack!',
        'Check your email to confirm your account, then sign in.',
        [{ text: 'Go to Sign In', onPress: () => router.replace('/(auth)/login') }],
      );
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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Earn it. Track it. Stack it. Free forever.</Text>
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
                    <Text style={[styles.socialIcon, styles.appleIcon]}>🍎</Text>
                    <Text style={[styles.socialText, styles.appleText]}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Johnson"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 characters"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
                <Text style={styles.label}>Referral Code (Optional)</Text>
                <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: '700' }}>🎁 GET 1 MO FREE</Text>
              </View>
              <TextInput
                style={[styles.input, referralCode.length > 0 && { borderColor: COLORS.accent }]}
                placeholder="STACK-XXXX"
                placeholderTextColor={COLORS.textMuted}
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading || !!socialLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={styles.buttonText}>Create Free Account 🚀</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.legal}>
              By signing up you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => Linking.openURL('https://tipstack.app/terms')}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.legalLink} onPress={() => Linking.openURL('https://tipstack.app/privacy')}>
                Privacy Policy
              </Text>
              . US users only.
            </Text>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign In</Text>
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
  header: { paddingTop: SPACING.xl, paddingBottom: SPACING.lg, alignItems: 'center' },
  logoImg: { width: 100, height: 100, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
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
  appleIcon: { fontSize: FONT_SIZES.md },
  socialText: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  appleText: { color: '#000000' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.base },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '500' },
  form: { gap: SPACING.base },
  inputGroup: { gap: SPACING.xs },
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
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#0D0F14' },
  legal: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  legalLink: { color: COLORS.primary, textDecorationLine: 'underline' },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.sm },
  loginLinkText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.base },
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
