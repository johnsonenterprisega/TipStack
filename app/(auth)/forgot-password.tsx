import React, { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../src/services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await authService.resetPasswordForEmail(email.trim().toLowerCase());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      if (Platform.OS !== 'web') {
        Alert.alert('Reset Failed', error.message);
      }
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          {isSuccess ? (
            /* Success State */
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>📧</Text>
              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.successMessage}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.successEmail}>{email.trim()}</Text>
              </Text>
              <Text style={styles.successInstructions}>
                Click the link in the email to set a new password, then return to TipStack to sign in.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Return to Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setIsSuccess(false);
                  handleResetPassword();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Didn't receive the email? Resend</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Email Input Form */
            <View style={styles.form}>
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0D0F14" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link 📩</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  backButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.base,
    marginBottom: SPACING.xl,
  },
  logoImg: {
    width: 64,
    height: 64,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  form: {
    gap: SPACING.base,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.glow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#0D0F14',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  successEmoji: {
    fontSize: 54,
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  successMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  successEmail: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  successInstructions: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  resendButton: {
    marginTop: SPACING.base,
    padding: SPACING.xs,
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
