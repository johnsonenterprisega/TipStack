import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useShiftStore, useGamificationStore } from '../../src/store';
import {
  ACHIEVEMENTS,
  getLevelForEarnings,
  calcStreak,
  AchievementDef,
} from '../../src/utils/gamification';
import CelebrationModal, { CelebrationData } from '../../src/components/CelebrationModal';
import { useAppTheme } from '../../src/store/themeStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';

const TIER_COLORS = {
  bronze: ['#CD7F32', '#A0522D'] as const,
  silver: ['#C0C0C0', '#909090'] as const,
  gold: ['#FFD700', '#FFA500'] as const,
  platinum: ['#E5E4E2', '#A8A9AD'] as const,
};

function AchievementCard({
  achievement,
  earned,
  onPress,
}: {
  achievement: AchievementDef;
  earned: boolean;
  onPress?: () => void;
}) {
  const tierGrad = TIER_COLORS[achievement.tier];
  return (
    <TouchableOpacity
      style={[styles.achievementCard, !earned && styles.achievementLocked]}
      onPress={onPress}
      disabled={!earned}
      activeOpacity={0.75}
    >
      {earned ? (
        <LinearGradient colors={tierGrad} style={styles.achievementIconBg}>
          <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.achievementIconBg, styles.achievementLockedBg]}>
          <Text style={[styles.achievementEmoji, { opacity: 0.3 }]}>{achievement.icon}</Text>
        </View>
      )}
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementName, !earned && styles.achievementNameLocked]}>
          {achievement.name}
        </Text>
        <Text style={styles.achievementDesc}>{achievement.description}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierGrad[0] + '33' }]}>
          <Text style={[styles.tierBadgeText, { color: tierGrad[0] }]}>
            {achievement.tier.toUpperCase()}
          </Text>
        </View>
      </View>
      {earned && (
        <Text style={styles.earnedCheck}>✓</Text>
      )}
    </TouchableOpacity>
  );
}

export default function AchievementsScreen() {
  const { colors } = useAppTheme();
  const { shifts } = useShiftStore();
  const { currentStreak } = useGamificationStore();
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const { earnedIds, levelInfo, streak } = useMemo(() => {
    const totalEarnings = shifts.reduce((s, sh) => s + sh.net_tips, 0);
    const { currentStreak: cs } = calcStreak(shifts);
    const earnedIds = ACHIEVEMENTS.filter((a) =>
      a.check(shifts, totalEarnings, cs),
    ).map((a) => a.id);
    return {
      earnedIds,
      levelInfo: getLevelForEarnings(totalEarnings),
      streak: cs,
    };
  }, [shifts]);

  const earnedCount = earnedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  // Sort: earned first, then locked
  const sorted = [
    ...ACHIEVEMENTS.filter((a) => earnedIds.includes(a.id)),
    ...ACHIEVEMENTS.filter((a) => !earnedIds.includes(a.id)),
  ];

  const handleLevelClick = () => {
    setCelebrationData({
      type: 'level_up',
      title: `${levelInfo.current.title} (Level ${levelInfo.current.level})`,
      subtitle: `You've stacked your way to ${levelInfo.current.title}! Keep logging shifts to climb to ${levelInfo.next?.title || 'The GOAT'}.`,
      emoji: levelInfo.current.icon,
    });
  };

  const handleBadgeClick = (a: AchievementDef) => {
    setCelebrationData({
      type: 'badge_unlocked',
      title: a.name,
      subtitle: `${a.description}\nTier: ${a.tier.toUpperCase()}`,
      emoji: a.icon,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>🏆 Achievements</Text>

        {/* Level Card */}
        <TouchableOpacity onPress={handleLevelClick} activeOpacity={0.85}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.levelCard}>
            <View style={styles.levelRow}>
              <View>
                <Text style={styles.levelIcon}>{levelInfo.current.icon}</Text>
                <Text style={styles.levelTitle}>{levelInfo.current.title}</Text>
                <Text style={styles.levelLvl}>Level {levelInfo.current.level}</Text>
              </View>
              <View style={styles.levelStats}>
                <View style={styles.levelStat}>
                  <Text style={styles.levelStatNum}>{earnedCount}</Text>
                  <Text style={styles.levelStatLabel}>Badges</Text>
                </View>
                <View style={styles.levelStatDivider} />
                <View style={styles.levelStat}>
                  <Text style={styles.levelStatNum}>{currentStreak}</Text>
                  <Text style={styles.levelStatLabel}>Streak 🔥</Text>
                </View>
                <View style={styles.levelStatDivider} />
                <View style={styles.levelStat}>
                  <Text style={styles.levelStatNum}>{shifts.length}</Text>
                  <Text style={styles.levelStatLabel}>Shifts</Text>
                </View>
              </View>
            </View>

            {/* Level progress */}
            {levelInfo.next && (
              <View style={styles.levelProgress}>
                <View style={styles.levelProgressBar}>
                  <View style={[styles.levelProgressFill, { width: `${levelInfo.progress * 100}%` }]} />
                </View>
                <Text style={styles.levelProgressLabel}>
                  Next: {levelInfo.next.icon} {levelInfo.next.title} (Tap to celebrate 🎉)
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Badge Count */}
        <View style={styles.badgeCountRow}>
          <Text style={styles.badgeCount}>{earnedCount} / {totalCount} badges earned</Text>
          <View style={styles.badgeProgressBar}>
            <View style={[styles.badgeProgressFill, { width: `${(earnedCount / totalCount) * 100}%` }]} />
          </View>
        </View>

        {/* Achievement List */}
        {sorted.map((a) => (
          <AchievementCard
            key={a.id}
            achievement={a}
            earned={earnedIds.includes(a.id)}
            onPress={() => handleBadgeClick(a)}
          />
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Celebration Confetti Modal */}
      <CelebrationModal
        visible={!!celebrationData}
        data={celebrationData}
        onClose={() => setCelebrationData(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.base },
  levelCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    ...SHADOWS.glow,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.base },
  levelIcon: { fontSize: 40, marginBottom: SPACING.xs },
  levelTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#FFF' },
  levelLvl: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  levelStats: { flexDirection: 'row', gap: SPACING.base, alignItems: 'center' },
  levelStat: { alignItems: 'center' },
  levelStatNum: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: '#FFF' },
  levelStatLabel: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.75)' },
  levelStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  levelProgress: { gap: SPACING.xs },
  levelProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, overflow: 'hidden' },
  levelProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: RADIUS.full },
  levelProgressLabel: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.8)' },
  badgeCountRow: { marginBottom: SPACING.base, gap: SPACING.xs },
  badgeCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  badgeProgressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  badgeProgressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: RADIUS.full },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  achievementLocked: { opacity: 0.5 },
  achievementIconBg: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  achievementLockedBg: { backgroundColor: COLORS.border },
  achievementEmoji: { fontSize: 26 },
  achievementInfo: { flex: 1, gap: 4 },
  achievementName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  achievementNameLocked: { color: COLORS.textSecondary },
  achievementDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 16 },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  tierBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  earnedCheck: { fontSize: FONT_SIZES.lg, color: COLORS.primary, fontWeight: '800' },
});
