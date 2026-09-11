import { Database } from '../types/database';

type Shift = Database['public']['Tables']['shifts']['Row'];

// ─── Level System ─────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: 'Rookie Server', minEarnings: 0, icon: '🍽️' },
  { level: 2, title: 'Hungry Hustler', minEarnings: 500, icon: '⚡' },
  { level: 3, title: 'Shift Grinder', minEarnings: 1500, icon: '💪' },
  { level: 4, title: 'Cash Machine', minEarnings: 3000, icon: '💸' },
  { level: 5, title: 'Pro Bartender', minEarnings: 6000, icon: '🍸' },
  { level: 6, title: 'Tip Magnet', minEarnings: 10000, icon: '🧲' },
  { level: 7, title: 'High Roller', minEarnings: 20000, icon: '🎰' },
  { level: 8, title: 'Stack Legend', minEarnings: 40000, icon: '👑' },
  { level: 9, title: 'Tip God', minEarnings: 75000, icon: '⚜️' },
  { level: 10, title: 'The GOAT', minEarnings: 150000, icon: '🐐' },
];

export function getLevelForEarnings(totalEarnings: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalEarnings >= lvl.minEarnings) current = lvl;
    else break;
  }
  const nextLevel = LEVELS[current.level] ?? null;
  const progress = nextLevel
    ? (totalEarnings - current.minEarnings) /
      (nextLevel.minEarnings - current.minEarnings)
    : 1;
  return { current, next: nextLevel, progress: Math.min(1, progress) };
}

// ─── Streak Calculator ────────────────────────────────────────────────────────

/**
 * Calculate the current shift logging streak (consecutive days with a shift).
 * Returns { currentStreak, longestStreak }.
 */
export function calcStreak(shifts: Shift[]): { currentStreak: number; longestStreak: number } {
  if (shifts.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Get unique dates, sorted descending
  const uniqueDates = [
    ...new Set(shifts.map((s) => s.date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Only count streak if user logged today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return { currentStreak: 0, longestStreak: calcLongestStreak(uniqueDates) };
  }

  let currentStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: calcLongestStreak(uniqueDates) };
}

function calcLongestStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const prev = new Date(sortedDatesDesc[i - 1]);
    const curr = new Date(sortedDatesDesc[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ─── Achievements Catalog ─────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  check: (shifts: Shift[], totalEarnings: number, streak: number) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // First-time achievements
  {
    id: 'first_shift',
    name: 'First Shift!',
    description: 'Log your very first shift.',
    icon: '🎉',
    tier: 'bronze',
    check: (shifts) => shifts.length >= 1,
  },
  {
    id: 'first_100_day',
    name: '$100 Day!',
    description: 'Earn $100+ in a single shift.',
    icon: '💯',
    tier: 'bronze',
    check: (shifts) => shifts.some((s) => s.net_tips >= 100),
  },
  {
    id: 'first_200_day',
    name: '$200 Day!',
    description: 'Earn $200+ in a single shift.',
    icon: '🔥',
    tier: 'silver',
    check: (shifts) => shifts.some((s) => s.net_tips >= 200),
  },
  {
    id: 'first_500_day',
    name: '$500 Day!',
    description: 'Earn $500+ in a single shift. You\'re on fire!',
    icon: '🌋',
    tier: 'gold',
    check: (shifts) => shifts.some((s) => s.net_tips >= 500),
  },
  // Streak achievements
  {
    id: 'streak_3',
    name: 'Hat Trick',
    description: 'Log shifts 3 days in a row.',
    icon: '🔥',
    tier: 'bronze',
    check: (_, __, streak) => streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Log shifts 7 days in a row.',
    icon: '⚔️',
    tier: 'silver',
    check: (_, __, streak) => streak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Iron Grinder',
    description: 'Log shifts 30 days in a row. Unstoppable!',
    icon: '💎',
    tier: 'platinum',
    check: (_, __, streak) => streak >= 30,
  },
  // Milestone achievements
  {
    id: 'total_1000',
    name: 'Grand Hustle',
    description: 'Earn $1,000 in total tips.',
    icon: '💰',
    tier: 'bronze',
    check: (_, total) => total >= 1000,
  },
  {
    id: 'total_5000',
    name: 'Stack Builder',
    description: 'Earn $5,000 in total tips.',
    icon: '🏦',
    tier: 'silver',
    check: (_, total) => total >= 5000,
  },
  {
    id: 'total_10000',
    name: 'Ten Grand Club',
    description: 'Earn $10,000 in total tips.',
    icon: '🏆',
    tier: 'gold',
    check: (_, total) => total >= 10000,
  },
  {
    id: 'total_50000',
    name: 'Tip Tycoon',
    description: 'Earn $50,000 in total tips. Legendary!',
    icon: '👑',
    tier: 'platinum',
    check: (_, total) => total >= 50000,
  },
  // Volume achievements
  {
    id: 'shifts_10',
    name: 'Getting Started',
    description: 'Log 10 shifts.',
    icon: '📅',
    tier: 'bronze',
    check: (shifts) => shifts.length >= 10,
  },
  {
    id: 'shifts_50',
    name: 'Regular',
    description: 'Log 50 shifts.',
    icon: '📆',
    tier: 'silver',
    check: (shifts) => shifts.length >= 50,
  },
  {
    id: 'shifts_100',
    name: 'Centurion',
    description: 'Log 100 shifts.',
    icon: '🎖️',
    tier: 'gold',
    check: (shifts) => shifts.length >= 100,
  },
];

/**
 * Returns IDs of newly earned achievements not already in earnedIds.
 */
export function checkNewAchievements(
  shifts: Shift[],
  totalEarnings: number,
  currentStreak: number,
  earnedIds: string[],
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !earnedIds.includes(a.id) && a.check(shifts, totalEarnings, currentStreak),
  );
}
