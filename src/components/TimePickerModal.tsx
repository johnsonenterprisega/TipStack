import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialTime?: string; // e.g. "4:30 PM"
  isClockOut?: boolean;
  onSelectTime: (formattedTime: string) => void;
  onClose: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_PRESETS = [0, 15, 30, 45];

const IN_PRESETS = ['11:00 AM', '11:30 AM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '6:00 PM'];
const OUT_PRESETS = ['9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '12:00 AM', '1:30 AM', '2:00 AM'];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  initialTime,
  isClockOut = false,
  onSelectTime,
  onClose,
}) => {
  const [selectedHour, setSelectedHour] = useState(isClockOut ? 10 : 4);
  const [selectedMinute, setSelectedMinute] = useState(isClockOut ? 0 : 30);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (visible) {
      if (initialTime) {
        const match = initialTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match) {
          const h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const med = (match[3] || 'PM').toUpperCase() as 'AM' | 'PM';
          setSelectedHour(h >= 1 && h <= 12 ? h : 4);
          setSelectedMinute(m >= 0 && m < 60 ? m : 0);
          setMeridiem(med);
          return;
        }
      }
      // Defaults based on role
      if (isClockOut) {
        setSelectedHour(10);
        setSelectedMinute(30);
        setMeridiem('PM');
      } else {
        setSelectedHour(4);
        setSelectedMinute(30);
        setMeridiem('PM');
      }
    }
  }, [visible, initialTime, isClockOut]);

  const formattedTimeString = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${meridiem}`;

  const handleAdjustMinute = (delta: number) => {
    let next = selectedMinute + delta;
    if (next >= 60) next = 0;
    if (next < 0) next = 59;
    setSelectedMinute(next);
  };

  const handleApplyPreset = (preset: string) => {
    const match = preset.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      setSelectedHour(parseInt(match[1], 10));
      setSelectedMinute(parseInt(match[2], 10));
      setMeridiem(match[3].toUpperCase() as 'AM' | 'PM');
    }
  };

  const handleConfirm = () => {
    onSelectTime(formattedTimeString);
    onClose();
  };

  const presets = isClockOut ? OUT_PRESETS : IN_PRESETS;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Big Active Time Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTime}>{formattedTimeString}</Text>
              
              {/* AM / PM Toggle */}
              <View style={styles.meridiemContainer}>
                <TouchableOpacity
                  style={[styles.meridiemBtn, meridiem === 'AM' && styles.meridiemBtnActive]}
                  onPress={() => setMeridiem('AM')}
                >
                  <Text style={[styles.meridiemText, meridiem === 'AM' && styles.meridiemTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.meridiemBtn, meridiem === 'PM' && styles.meridiemBtnActive]}
                  onPress={() => setMeridiem('PM')}
                >
                  <Text style={[styles.meridiemText, meridiem === 'PM' && styles.meridiemTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Shift Presets */}
            <Text style={styles.sectionLabel}>⚡ Popular Shift Times</Text>
            <View style={styles.presetsRow}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    formattedTimeString === preset && styles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      formattedTimeString === preset && styles.presetTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hour Picker (1 to 12) */}
            <Text style={styles.sectionLabel}>🕐 Select Hour</Text>
            <View style={styles.hoursGrid}>
              {HOURS.map((h) => {
                const isActive = selectedHour === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourPill, isActive && styles.hourPillActive]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[styles.hourText, isActive && styles.hourTextActive]}>{h}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Minute Picker */}
            <Text style={styles.sectionLabel}>⏱️ Select Minute</Text>
            <View style={styles.minuteContainer}>
              <View style={styles.minutePresetsRow}>
                {MINUTE_PRESETS.map((m) => {
                  const isActive = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.minutePill, isActive && styles.minutePillActive]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.minuteText, isActive && styles.minuteTextActive]}>
                        :{m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Minute Fine Stepper */}
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustMinute(-5)}>
                  <Text style={styles.stepperText}>-5m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustMinute(-1)}>
                  <Text style={styles.stepperText}>-1m</Text>
                </TouchableOpacity>
                <View style={styles.stepperDisplay}>
                  <Text style={styles.stepperDisplayText}>:{selectedMinute.toString().padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustMinute(1)}>
                  <Text style={styles.stepperText}>+1m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleAdjustMinute(5)}>
                  <Text style={styles.stepperText}>+5m</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Set Time Button */}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Set Time ({formattedTimeString})</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  previewContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  previewTime: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  meridiemContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    padding: 3,
    marginTop: SPACING.sm,
    gap: 4,
  },
  meridiemBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
  },
  meridiemBtnActive: {
    backgroundColor: COLORS.primary,
  },
  meridiemText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  meridiemTextActive: {
    color: '#0D0F14',
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '22',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  hourPill: {
    width: '14.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '25',
  },
  hourText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  hourTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  minuteContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  minutePresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  minutePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minutePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '25',
  },
  minuteText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  minuteTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepperDisplay: {
    paddingHorizontal: 12,
  },
  stepperDisplayText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  confirmBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: '#0D0F14',
  },
});
