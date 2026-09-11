import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { Database } from '../types/database';
import { useJobStore, useAuthStore } from '../store';
import { tipCalculator } from '../services/api';
import { adService } from '../services/adService';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

type Shift = Database['public']['Tables']['shifts']['Row'];

interface ShiftFlexModalProps {
  visible: boolean;
  shift: Shift | null;
  onClose: () => void;
}

type FlexTheme = 'gold' | 'midnight' | 'cyber' | 'cash';
type DisplayMode = 'amount' | 'hourly' | 'stealth';

const THEMES: Record<
  FlexTheme,
  {
    name: string;
    gradient: [string, string, string];
    accent: string;
    textColor: string;
    border: string;
  }
> = {
  gold: {
    name: '🌟 Emerald Gold',
    gradient: ['#0B2B1B', '#071A10', '#030D08'],
    accent: '#FFD166',
    textColor: '#FFFFFF',
    border: '#FFD16644',
  },
  midnight: {
    name: '🖤 Midnight Stealth',
    gradient: ['#1A1E29', '#0E1118', '#07090D'],
    accent: '#00E5FF',
    textColor: '#FFFFFF',
    border: '#00E5FF44',
  },
  cyber: {
    name: '🚀 Cyber Neon',
    gradient: ['#3A0066', '#1E0038', '#0A0014'],
    accent: '#FF007F',
    textColor: '#FFFFFF',
    border: '#FF007F55',
  },
  cash: {
    name: '💰 Cash Green',
    gradient: ['#004D40', '#002B24', '#001410'],
    accent: '#00E676',
    textColor: '#FFFFFF',
    border: '#00E67644',
  },
};

const MOTTO_TAGS = [
  '🔥 BAG SECURED',
  '💸 STACKED IT',
  '🏆 NIGHT TO REMEMBER',
  '⚡ GRIND PAYS OFF',
  '👑 SERVICE INDUSTRY GOAT',
];

export default function ShiftFlexModal({ visible, shift, onClose }: ShiftFlexModalProps) {
  const { jobs } = useJobStore();
  const viewShotRef = useRef<any>(null);

  const [selectedTheme, setSelectedTheme] = useState<FlexTheme>('gold');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('amount');
  const [selectedTag, setSelectedTag] = useState(MOTTO_TAGS[0]);
  const [showWorkplace, setShowWorkplace] = useState(true);
  const [showHours, setShowHours] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  if (!shift) return null;

  const job = jobs.find((j) => j.id === shift.job_id);
  const currentTheme = THEMES[selectedTheme];
  const hourlyRate = shift.hours_worked > 0 ? shift.net_tips / shift.hours_worked : 0;
  const shiftDate = format(parseISO(shift.date), 'EEEE, MMMM d, yyyy');

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    setIsSharing(true);
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your Shift Flex Story 📸',
            UTI: 'public.png',
          });
          setTimeout(() => {
            adService.recordTaskAndShowInterstitial(
              useAuthStore.getState().profile?.subscription_tier === 'pro',
              'share_flex_story'
            );
          }, 600);
        } else {
          Alert.alert('Story Ready!', 'Flex card image captured successfully.');
        }
      }
    } catch (err: any) {
      console.warn('Failed to share story card:', err);
      Alert.alert('Share Error', 'Could not export the flex card image.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>📸 Shift Flex Story Card</Text>
              <Text style={styles.modalSubtitle}>
                Generate a branded 9:16 graphic for Instagram, TikTok, or messages!
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ─── 9:16 STORY CARD PREVIEW (CAPTURED BY VIEW-SHOT) ─── */}
            <View style={styles.cardPreviewContainer}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
                style={styles.viewShotWrapper}
              >
                <LinearGradient
                  colors={currentTheme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.storyCard, { borderColor: currentTheme.border }]}
                >
                  {/* Top Branding Header */}
                  <View style={styles.storyTopBrand}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.storyLogo}
                      resizeMode="contain"
                    />
                    <View>
                      <Text style={styles.storyBrandName}>TipStack</Text>
                      <Text style={styles.storyTagline}>EARN IT. TRACK IT. STACK IT.</Text>
                    </View>
                  </View>

                  {/* Motivational Sticker Tag */}
                  <View
                    style={[
                      styles.storyMottoBadge,
                      { backgroundColor: currentTheme.accent + '25', borderColor: currentTheme.accent },
                    ]}
                  >
                    <Text style={[styles.storyMottoText, { color: currentTheme.accent }]}>
                      {selectedTag}
                    </Text>
                  </View>

                  {/* Center Main Earnings Graphic */}
                  <View style={styles.storyCenterBody}>
                    <Text style={styles.storyShiftDateLabel}>{shiftDate}</Text>

                    {displayMode === 'amount' && (
                      <View style={styles.amountWrap}>
                        <Text style={styles.storyDollarSign}>$</Text>
                        <Text style={[styles.storyMainAmount, { color: currentTheme.accent }]}>
                          {Math.round(shift.net_tips)}
                        </Text>
                      </View>
                    )}

                    {displayMode === 'hourly' && (
                      <View style={styles.amountWrap}>
                        <Text style={[styles.storyMainAmount, { color: currentTheme.accent }]}>
                          ${hourlyRate.toFixed(0)}
                        </Text>
                        <Text style={styles.storyPerHourSub}>/hr</Text>
                      </View>
                    )}

                    {displayMode === 'stealth' && (
                      <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
                        <Text style={{ fontSize: 52 }}>🚀💸</Text>
                        <Text style={[styles.storyMainAmount, { color: currentTheme.accent, fontSize: 32 }]}>
                          STACKED IT
                        </Text>
                      </View>
                    )}

                    <Text style={styles.storyNetLabel}>NET TIPS EARNED</Text>
                  </View>

                  {/* Metadata Footer Badges */}
                  <View style={styles.storyMetaRow}>
                    {showWorkplace && (
                      <View style={styles.storyMetaPill}>
                        <View style={[styles.pillDot, { backgroundColor: job?.color || currentTheme.accent }]} />
                        <Text style={styles.storyMetaPillText}>{job?.name || 'Service Shift'}</Text>
                      </View>
                    )}
                    {showHours && shift.hours_worked > 0 && (
                      <View style={styles.storyMetaPill}>
                        <Text style={styles.storyMetaPillText}>⏱️ {shift.hours_worked} Hours Worked</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Download Stamp */}
                  <View style={styles.storyBottomFooter}>
                    <Text style={styles.storyAppStoreText}>Track your shifts with @TipStackApp</Text>
                  </View>
                </LinearGradient>
              </ViewShot>
            </View>

            {/* ─── CONTROLS: THEME SELECTOR ─── */}
            <View style={styles.controlSection}>
              <Text style={styles.controlSectionTitle}>🎨 Card Theme</Text>
              <View style={styles.themeChipsRow}>
                {(Object.keys(THEMES) as FlexTheme[]).map((themeKey) => {
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <TouchableOpacity
                      key={themeKey}
                      style={[
                        styles.themeChip,
                        isSelected && { borderColor: THEMES[themeKey].accent, backgroundColor: THEMES[themeKey].accent + '20' },
                      ]}
                      onPress={() => setSelectedTheme(themeKey)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.themeChipText,
                          isSelected && { color: THEMES[themeKey].accent, fontWeight: '800' },
                        ]}
                      >
                        {THEMES[themeKey].name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ─── CONTROLS: DISPLAY MODE TOGGLE ─── */}
            <View style={styles.controlSection}>
              <Text style={styles.controlSectionTitle}>👁️ Privacy & Numbers</Text>
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, displayMode === 'amount' && styles.modeToggleBtnActive]}
                  onPress={() => setDisplayMode('amount')}
                >
                  <Text style={[styles.modeToggleText, displayMode === 'amount' && styles.modeToggleTextActive]}>
                    💰 Total ($)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, displayMode === 'hourly' && styles.modeToggleBtnActive]}
                  onPress={() => setDisplayMode('hourly')}
                >
                  <Text style={[styles.modeToggleText, displayMode === 'hourly' && styles.modeToggleTextActive]}>
                    ⚡ Hourly ($/hr)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, displayMode === 'stealth' && styles.modeToggleBtnActive]}
                  onPress={() => setDisplayMode('stealth')}
                >
                  <Text style={[styles.modeToggleText, displayMode === 'stealth' && styles.modeToggleTextActive]}>
                    🔒 Stealth Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── CONTROLS: MOTTO STICKER ─── */}
            <View style={styles.controlSection}>
              <Text style={styles.controlSectionTitle}>🏷️ Motto Sticker</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs }}>
                {MOTTO_TAGS.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagPill, isSelected && styles.tagPillActive]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ─── ACTION BUTTONS ─── */}
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                disabled={isSharing}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={COLORS.gradientGold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareBtnGradient}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#0D0F14" />
                  ) : (
                    <Text style={styles.shareBtnText}>📸 Share Shift to Instagram / Stories</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.base,
    paddingHorizontal: SPACING.base,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  cardPreviewContainer: {
    marginVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewShotWrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  storyCard: {
    width: 310,
    height: 440,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyTopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
  },
  storyLogo: {
    width: 36,
    height: 36,
  },
  storyBrandName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  storyTagline: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  storyMottoBadge: {
    paddingHorizontal: SPACING.base,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginVertical: SPACING.xs,
  },
  storyMottoText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    letterSpacing: 1,
  },
  storyCenterBody: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  storyShiftDateLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  storyDollarSign: {
    fontSize: 32,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
  },
  storyMainAmount: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 70,
  },
  storyPerHourSub: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  storyNetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginTop: 2,
  },
  storyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  storyMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  storyMetaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyBottomFooter: {
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  storyAppStoreText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  controlSection: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  controlSectionTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  themeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  themeChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  themeChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 3,
    gap: 4,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modeToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeToggleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modeToggleTextActive: {
    color: '#0D0F14',
    fontWeight: '900',
  },
  tagPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  tagPillActive: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
  },
  tagPillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  tagPillTextActive: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  actionGroup: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  shareBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  shareBtnGradient: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#0D0F14',
  },
});
