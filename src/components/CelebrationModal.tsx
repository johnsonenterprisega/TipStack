import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

export interface CelebrationData {
  type: 'level_up' | 'goal_hit' | 'badge_unlocked';
  title: string;
  subtitle: string;
  emoji: string;
  tierName?: string;
}

interface CelebrationModalProps {
  visible: boolean;
  data: CelebrationData | null;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#00C9A7', '#FFD166', '#FF6B6B', '#6C5CE7', '#FFFFFF', '#00D2D3'];
const NUM_CONFETTI = 36;

export default function CelebrationModal({
  visible,
  data,
  onClose,
}: CelebrationModalProps) {
  const { width, height } = useWindowDimensions();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Particle positions
  const particles = useRef(
    Array.from({ length: NUM_CONFETTI }).map(() => ({
      x: new Animated.Value(Math.random() * (width || 360)),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))
  ).current;

  useEffect(() => {
    if (visible && data) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      // Card scale-up animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Confetti rain
      particles.forEach((p, idx) => {
        p.y.setValue(-50 - Math.random() * 80);
        p.x.setValue(Math.random() * (width || 360));
        p.rotate.setValue(0);

        Animated.parallel([
          Animated.timing(p.y, {
            toValue: height + 100,
            duration: 2500 + Math.random() * 1500,
            delay: (idx % 6) * 120,
            easing: Easing.in(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(p.rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1) * 3,
            duration: 3000,
            delay: (idx % 6) * 120,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [visible, data]);

  if (!data) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        {/* Confetti Particles */}
        {particles.map((p, i) => {
          const spin = p.rotate.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.shape === 'rect' ? p.size * 1.6 : p.size,
                  borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
                  backgroundColor: p.color,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
          );
        })}

        {/* Celebration Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={
              data.type === 'level_up'
                ? COLORS.gradientGold
                : data.type === 'goal_hit'
                ? COLORS.gradientPrimary
                : ['#6C5CE7', '#00C9A7']
            }
            style={styles.card}
          >
            <Text style={styles.emoji}>{data.emoji}</Text>
            <Text style={styles.badgeLabel}>
              {data.type === 'level_up'
                ? '⭐ LEVEL UP!'
                : data.type === 'goal_hit'
                ? '🎯 GOAL CRUSHED!'
                : '🏆 BADGE UNLOCKED!'}
            </Text>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>

            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  } catch {}
                }
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.claimButtonText}>Keep Stacking 🚀</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  particle: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 1,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    zIndex: 10,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  emoji: {
    fontSize: 72,
    marginBottom: SPACING.sm,
  },
  badgeLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    color: '#0D0F14',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
    color: '#0D0F14',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#0D0F14',
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  claimButton: {
    backgroundColor: '#0D0F14',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
