import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface SetupChecklistCardProps {
  hasWorkplace: boolean;
  hasShift: boolean;
  hasGoal: boolean;
  hasCompletedTour: boolean;
  onOpenWorkplace: () => void;
  onOpenShift: () => void;
  onOpenGoal: () => void;
  onOpenTour: () => void;
  onDismiss?: () => void;
}

export default function SetupChecklistCard({
  hasWorkplace,
  hasShift,
  hasGoal,
  hasCompletedTour,
  onOpenWorkplace,
  onOpenShift,
  onOpenGoal,
  onOpenTour,
  onDismiss,
}: SetupChecklistCardProps) {
  const steps = [
    {
      id: 'workplace',
      title: 'Configure Workplace & Base Wage',
      desc: 'Add your restaurant/bar, hourly pay & tip-out %',
      icon: '🏢',
      completed: hasWorkplace,
      onPress: onOpenWorkplace,
      actionText: 'Add Workplace',
    },
    {
      id: 'shift',
      title: 'Log Your First Shift',
      desc: 'Record hours, cash tips, credit tips & see live $/hr',
      icon: '⚡',
      completed: hasShift,
      onPress: onOpenShift,
      actionText: 'Log Shift',
    },
    {
      id: 'goal',
      title: 'Set a Weekly Earnings Goal',
      desc: 'Lock in your target to track pace & milestones',
      icon: '🎯',
      completed: hasGoal,
      onPress: onOpenGoal,
      actionText: 'Set Target',
    },
    {
      id: 'tour',
      title: 'Interactive Feature Tour',
      desc: 'Discover Golden Shifts, tax tools & free migration',
      icon: '✨',
      completed: hasCompletedTour,
      onPress: onOpenTour,
      actionText: 'Start Tour',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percent = Math.round((completedCount / steps.length) * 100);
  const isAllComplete = completedCount === steps.length;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={styles.title}>🚀 Fast-Start Setup Guide</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{completedCount}/{steps.length} DONE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {isAllComplete
              ? '🎉 All set! Your profile is fully calibrated.'
              : 'Complete these quick steps to get the most out of TipStack:'}
          </Text>
        </View>

        {onDismiss && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              onDismiss();
            }}
            style={styles.dismissBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={['#00C9A7', '#00E5BF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.max(8, percent)}%` }]}
        />
      </View>

      {/* Steps List */}
      <View style={styles.stepsList}>
        {steps.map((step, idx) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepRow,
              step.completed && styles.stepRowCompleted,
            ]}
            onPress={() => {
              triggerHaptic();
              step.onPress();
            }}
            activeOpacity={0.8}
          >
            {/* Left Icon / Checkbox */}
            <View
              style={[
                styles.checkCircle,
                step.completed && styles.checkCircleCompleted,
              ]}
            >
              {step.completed ? (
                <Text style={styles.checkMark}>✓</Text>
              ) : (
                <Text style={styles.stepNumber}>{idx + 1}</Text>
              )}
            </View>

            {/* Text details */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.stepEmoji}>{step.icon}</Text>
                <Text
                  style={[
                    styles.stepTitle,
                    step.completed && styles.stepTitleCompleted,
                  ]}
                >
                  {step.title}
                </Text>
              </View>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>

            {/* Action pill / status */}
            <View
              style={[
                styles.actionPill,
                step.completed && styles.actionPillCompleted,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  step.completed && styles.actionTextCompleted,
                ]}
              >
                {step.completed ? 'Done ✓' : `${step.actionText} →`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161920',
    borderWidth: 1.5,
    borderColor: '#00C9A7' + '44',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#00C9A7' + '22',
    borderColor: '#00C9A7',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#00C9A7',
  },
  subtitle: {
    fontSize: 11,
    color: '#8B91A7',
    lineHeight: 15,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 14,
    color: '#8B91A7',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#272C3A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#11141A',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  stepRowCompleted: {
    borderColor: '#00C9A7' + '33',
    backgroundColor: '#00C9A7' + '08',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#272C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: COLORS.primary,
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0F14',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B91A7',
  },
  stepEmoji: {
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitleCompleted: {
    color: '#F0F2F8',
  },
  stepDesc: {
    fontSize: 10,
    color: '#8B91A7',
    marginTop: 1,
  },
  actionPill: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '55',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  actionPillCompleted: {
    backgroundColor: '#272C3A',
    borderColor: 'transparent',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  actionTextCompleted: {
    color: '#8B91A7',
    fontWeight: '600',
  },
});
