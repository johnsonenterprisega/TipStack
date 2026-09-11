import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../store/themeStore';
import { AppThemeId, APP_THEMES } from '../theme/themes';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelectorModal({ visible, onClose }: ThemeSelectorModalProps) {
  const { themeId, setTheme } = useThemeStore();

  const handleSelectTheme = (id: AppThemeId) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
    setTheme(id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎨 App Color Theme</Text>
              <Text style={styles.subtitle}>
                Customize the aesthetic of TipStack to match your personal vibe.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {(Object.keys(APP_THEMES) as AppThemeId[]).map((id) => {
              const themeConfig = APP_THEMES[id];
              const isSelected = themeId === id;

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.themeCard,
                    isSelected && { borderColor: themeConfig.colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectTheme(id)}
                  activeOpacity={0.85}
                >
                  {/* Theme Gradient Banner */}
                  <LinearGradient
                    colors={themeConfig.colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardHeaderGradient}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                      <Text style={styles.themeEmoji}>{themeConfig.emoji}</Text>
                      <View>
                        <Text style={styles.themeName}>{themeConfig.name}</Text>
                        <Text style={styles.themeTagline}>{themeConfig.tagline}</Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>✓ ACTIVE</Text>
                      </View>
                    ) : (
                      <View style={styles.selectPill}>
                        <Text style={styles.selectPillText}>SELECT</Text>
                      </View>
                    )}
                  </LinearGradient>

                  {/* Swatches & Mini Mockup */}
                  <View style={styles.cardBody}>
                    <View style={styles.swatchesRow}>
                      <View style={styles.swatchItem}>
                        <View
                          style={[styles.colorCircle, { backgroundColor: themeConfig.colors.primary }]}
                        />
                        <Text style={styles.swatchLabel}>Primary</Text>
                      </View>
                      <View style={styles.swatchItem}>
                        <View
                          style={[styles.colorCircle, { backgroundColor: themeConfig.colors.accent }]}
                        />
                        <Text style={styles.swatchLabel}>Accent</Text>
                      </View>
                      <View style={styles.swatchItem}>
                        <View
                          style={[styles.colorCircle, { backgroundColor: themeConfig.colors.surface }]}
                        />
                        <Text style={styles.swatchLabel}>Surface</Text>
                      </View>
                      <View style={styles.swatchItem}>
                        <View
                          style={[styles.colorCircle, { backgroundColor: themeConfig.colors.background }]}
                        />
                        <Text style={styles.swatchLabel}>Dark BG</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.88}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.base,
    paddingHorizontal: SPACING.base,
    maxHeight: '90%',
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
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  subtitle: {
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
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  themeCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  themeEmoji: {
    fontSize: 26,
  },
  themeName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '900',
    color: '#0D0F14',
  },
  themeTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(13, 15, 20, 0.75)',
    marginTop: 1,
  },
  activePill: {
    backgroundColor: '#0D0F14',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD166',
  },
  selectPill: {
    backgroundColor: 'rgba(13, 15, 20, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  selectPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D0F14',
  },
  cardBody: {
    padding: SPACING.md,
  },
  swatchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swatchItem: {
    alignItems: 'center',
    gap: 4,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  swatchLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  doneBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
