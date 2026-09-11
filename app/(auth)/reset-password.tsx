import React, { useState, useEffect } from 'react';
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
import { authService } from '../../src/services/api';
import { supabase } from '../../src/lib/supabase';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If arriving from Supabase reset link on web, parse tokens from hash
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    }
  }, []);

  const handleUpdatePassword = async () => {
    setErrorMessage('');

    if (!password.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const { error } = await authService.updatePassword(password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      if (Platform.OS !== 'web') {
        Alert.alert('Update Failed', error.message);
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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new secure password below to regain access to your TipStack account.
            </Text>
          </View>

          {isSuccess ? (
            /* Success Card */
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>🔒✨</Text>
              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successMessage}>
                Your password has been successfully reset. You can now access all your shifts and earnings.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/(tabs)/home')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Continue to Dashboard 🚀</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* New Password Form */
            <View style={styles.form}>
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleUpdatePassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0D0F14" />
                ) : (
                  <Text style={styles.buttonText}>Save New Password 🔒</Text>
                )}
              </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
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
    marginBottom: SPACING.xl,
  },
});
