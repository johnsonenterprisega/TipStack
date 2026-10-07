import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../theme';

const { width } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.65, 260);

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  isLoading?: boolean;
}

export default function AnimatedSplashScreen({ onFinish, isLoading = false }: AnimatedSplashScreenProps) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTilt = useRef(new Animated.Value(-4)).current;
  
  // Shockwave & ambient glow
  const rippleScale = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const ambientPulse = useRef(new Animated.Value(1)).current;
  const goldGlowOpacity = useRef(new Animated.Value(0)).current;

  // Specular light shimmer sweep across logo
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;

  // Staggered tagline words
  const word1Opacity = useRef(new Animated.Value(0)).current;
  const word1TranslateY = useRef(new Animated.Value(14)).current;
  const word2Opacity = useRef(new Animated.Value(0)).current;
  const word2TranslateY = useRef(new Animated.Value(14)).current;
  const word3Opacity = useRef(new Animated.Value(0)).current;
  const word3TranslateY = useRef(new Animated.Value(14)).current;
  const word3Scale = useRef(new Animated.Value(0.85)).current;

  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    // Continuous ambient breathing pulse
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, {
          toValue: 1.08,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(ambientPulse, {
          toValue: 0.98,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );
    ambientLoop.start();

    // Cinematic Entrance Choreography
    Animated.sequence([
      // 1. Explosive Spring Pop + Shockwave Ripple
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 48,
          useNativeDriver: useNative,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: useNative,
        }),
        Animated.timing(logoTilt, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
        // Expanding emerald ripple ring
        Animated.sequence([
          Animated.timing(rippleOpacity, {
            toValue: 0.8,
            duration: 180,
            useNativeDriver: useNative,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 650,
            easing: Easing.out(Easing.ease),
            useNativeDriver: useNative,
          }),
        ]),
        Animated.timing(rippleScale, {
          toValue: 1.5,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
        // Golden accent aura
        Animated.timing(goldGlowOpacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: useNative,
        }),
      ]),

      // 2. Specular Light Shimmer Sweep across the logo
      Animated.parallel([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: useNative,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ]),

      // 3. Kinetic Staggered Tagline Reveal
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(word1Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: useNative,
          }),
          Animated.spring(word1TranslateY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: useNative,
          }),
        ]),
        Animated.parallel([
          Animated.timing(word2Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: useNative,
          }),
          Animated.spring(word2TranslateY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: useNative,
          }),
        ]),
        Animated.parallel([
          Animated.timing(word3Opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: useNative,
          }),
          Animated.spring(word3TranslateY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: useNative,
          }),
          Animated.spring(word3Scale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: useNative,
          }),
        ]),
      ]),

      // 4. Subtext fade-in & Progress Fill
      Animated.parallel([
        Animated.timing(subtextOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: useNative,
        }),
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      // Exit smoothly when ready
      if (!isLoading && onFinish) {
        setTimeout(() => {
          triggerExit();
        }, 250);
      }
    });

    return () => ambientLoop.stop();
  }, [isLoading]);

  const triggerExit = () => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(logoScale, {
        toValue: 1.12,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  };

  useEffect(() => {
    if (!isLoading && onFinish) {
      const timer = setTimeout(() => {
        triggerExit();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  const rotateValue = logoTilt.interpolate({
    inputRange: [-4, 0],
    outputRange: ['-4deg', '0deg'],
  });

  const shimmerTranslateX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-LOGO_SIZE * 1.4, LOGO_SIZE * 1.4],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Expanding shockwave ripple */}
      <Animated.View
        style={[
          styles.shockwaveRipple,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      />

      {/* Gold accent aura behind coin */}
      <Animated.View
        style={[
          styles.goldAura,
          {
            opacity: goldGlowOpacity,
            transform: [{ scale: ambientPulse }],
          },
        ]}
      />

      {/* Cyan/Emerald breathing backglow */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: ambientPulse }],
          },
        ]}
      />

      {/* Main Logo Container */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: rotateValue },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Specular Light Shimmer Sweep Layer */}
        <Animated.View
          style={[
            styles.shimmerMask,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslateX }, { rotate: '25deg' }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.42)',
              'rgba(0, 201, 167, 0.28)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </Animated.View>

      {/* Kinetic Staggered Tagline */}
      <View style={styles.textContainer}>
        <View style={styles.taglineRow}>
          <Animated.View
            style={{
              opacity: word1Opacity,
              transform: [{ translateY: word1TranslateY }],
            }}
          >
            <Text style={styles.taglineTeal}>EARN IT.</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: word2Opacity,
              transform: [{ translateY: word2TranslateY }],
            }}
          >
            <Text style={styles.taglineGold}> TRACK IT.</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: word3Opacity,
              transform: [
                { translateY: word3TranslateY },
                { scale: word3Scale },
              ],
            }}
          >
            <Text style={styles.taglineWhite}> STACK IT.</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: subtextOpacity, alignItems: 'center' }}>
          <Text style={styles.targetAudience}>
            Built for all tipped professionals: Bartenders, Servers, Gig Workers & Salons
          </Text>
          <Text style={styles.byCompany}>by Johnson Enterprise Tech</Text>
        </Animated.View>
      </View>

      {/* Polished Glow Loading Indicator */}
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
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(0, 201, 167, 0.14)',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 70,
  },
  shockwaveRipple: {
    position: 'absolute',
    width: LOGO_SIZE * 1.15,
    height: LOGO_SIZE * 1.15,
    borderRadius: (LOGO_SIZE * 1.15) / 2,
    borderWidth: 2,
    borderColor: '#00C9A7',
    backgroundColor: 'rgba(0, 201, 167, 0.08)',
  },
  goldAura: {
    position: 'absolute',
    width: LOGO_SIZE * 0.85,
    height: LOGO_SIZE * 0.85,
    borderRadius: (LOGO_SIZE * 0.85) / 2,
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 50,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 16,
    overflow: 'hidden',
    borderRadius: 44,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  shimmerMask: {
    position: 'absolute',
    top: -LOGO_SIZE * 0.5,
    left: 0,
    width: 60,
    height: LOGO_SIZE * 2,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 8,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineTeal: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '900',
    color: '#00C9A7',
    letterSpacing: 2,
  },
  taglineGold: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '900',
    color: '#FFD166',
    letterSpacing: 2,
  },
  taglineWhite: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  targetAudience: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: 2,
    marginBottom: 2,
  },
  byCompany: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 60,
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00C9A7',
    borderRadius: RADIUS.full,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
