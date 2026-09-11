import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  isLoading?: boolean;
}

export default function AnimatedSplashScreen({ onFinish, isLoading = false }: AnimatedSplashScreenProps) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // 1. Logo pop & fade in + glow
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: useNative,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: useNative,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: useNative,
        }),
      ]),
      // 2. Tagline slide-up & fade in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: useNative,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: useNative,
        }),
      ]),
      // 3. Progress bar fills
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // If not locked in loading, fade out smoothly
      if (!isLoading && onFinish) {
        setTimeout(() => {
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: useNative,
          }).start(() => {
            onFinish();
          });
        }, 300);
      }
    });
  }, [isLoading]);

  // When isLoading changes from true to false, trigger exit
  useEffect(() => {
    if (!isLoading && onFinish) {
      const timer = setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: useNative,
        }).start(() => {
          onFinish();
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background radial-like glow */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            opacity: glowOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      />

      {/* Main Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <View style={styles.taglineRow}>
          <Text style={styles.taglineTeal}>EARN IT.</Text>
          <Text style={styles.taglineGold}> TRACK IT.</Text>
          <Text style={styles.taglineWhite}> STACK IT.</Text>
        </View>
        <Text style={styles.targetAudience}>
          Built for all tipped professionals: Bartenders, Servers, Gig Workers, Salons & More!
        </Text>
        <Text style={styles.byCompany}>by Johnson Enterprise Tech</Text>
      </Animated.View>

      {/* Animated Loading Bar */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D0F14',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  logoWrap: {
    width: Math.min(width * 0.65, 260),
    height: Math.min(width * 0.65, 260),
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 6,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineTeal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: '#00C9A7',
    letterSpacing: 1.8,
  },
  taglineGold: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: '#FFD166',
    letterSpacing: 1.8,
  },
  taglineWhite: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.8,
  },
  targetAudience: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: 2,
    marginBottom: 2,
  },
  byCompany: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 60,
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00C9A7',
    borderRadius: RADIUS.full,
  },
});
