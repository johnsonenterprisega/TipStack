import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuthStore, useJobStore } from '../store';
import { jobService } from '../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../theme';
import { Database } from '../types/database';

type Job = Database['public']['Tables']['jobs']['Row'];

const COLOR_PRESETS = [
  '#00C9A7', // Teal
  '#FFD166', // Gold
  '#FF6B6B', // Coral
  '#6C5CE7', // Purple
  '#0984E3', // Blue
];

interface JobModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function JobModal({ visible, job, onClose, onSaved }: JobModalProps) {
  const { session } = useAuthStore();
  const { addJob, updateJob, removeJob } = useJobStore();

  const [name, setName] = useState(job?.name ?? '');
  const [role, setRole] = useState(job?.role ?? '');
  const [wage, setWage] = useState(job?.hourly_wage?.toString() ?? '');
  const [tipOut, setTipOut] = useState(job?.tip_out_percent?.toString() ?? '');
  const [selectedColor, setSelectedColor] = useState(job?.color ?? COLOR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setName(job?.name ?? '');
      setRole(job?.role ?? '');
      setWage(job?.hourly_wage?.toString() ?? '');
      setTipOut(job?.tip_out_percent?.toString() ?? '');
      setSelectedColor(job?.color ?? COLOR_PRESETS[0]);
      setErrorMsg('');
    }
  }, [visible, job]);

  const isEditing = !!job;

  const handleSave = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter a workplace name.');
      return;
    }
    if (!session?.user?.id) {
      setErrorMsg('User not signed in.');
      return;
    }

    setIsSaving(true);
    const hourlyWageNum = parseFloat(wage) || 0;
    const tipOutNum = parseFloat(tipOut) || 0;

    try {
      if (isEditing && job) {
        const { error } = await jobService.updateJob(job.id, {
          name: name.trim(),
          role: role.trim() || null,
          hourly_wage: hourlyWageNum,
          tip_out_percent: tipOutNum,
          color: selectedColor,
        });
        if (error) throw error;
        updateJob(job.id, {
          name: name.trim(),
          role: role.trim() || null,
          hourly_wage: hourlyWageNum,
          tip_out_percent: tipOutNum,
          color: selectedColor,
        });
      } else {
        const { data, error } = await jobService.createJob({
          user_id: session.user.id,
          name: name.trim(),
          role: role.trim() || null,
          hourly_wage: hourlyWageNum,
          tip_out_percent: tipOutNum,
          color: selectedColor,
        });
        if (error) throw error;
        if (data) addJob(data);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to save workplace.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    setIsSaving(true);
    try {
      const { error } = await jobService.deleteJob(job.id);
      if (error) throw error;
      removeJob(job.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to delete workplace.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>
            {isEditing ? 'Edit Workplace' : '🏢 Add Workplace'}
          </Text>

          {!!errorMsg && <Text style={modalStyles.errorText}>{errorMsg}</Text>}

          {/* Name */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Workplace / Restaurant Name *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g., The Capital Grille"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Role */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Role / Position (Optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g., Lead Bartender, Server"
              placeholderTextColor={COLORS.textMuted}
              value={role}
              onChangeText={setRole}
            />
          </View>

          {/* Base Wage & Tip-Out % */}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={[modalStyles.inputGroup, { flex: 1 }]}>
              <Text style={modalStyles.label}>Base Wage ($/hr)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="5.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={wage}
                onChangeText={setWage}
              />
            </View>
            <View style={[modalStyles.inputGroup, { flex: 1 }]}>
              <Text style={modalStyles.label}>Tip-Out % (Auto)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="3.0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={tipOut}
                onChangeText={setTipOut}
              />
            </View>
          </View>

          {/* Color Selector */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Badge Color</Text>
            <View style={modalStyles.colorRow}>
              {COLOR_PRESETS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    modalStyles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && modalStyles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[modalStyles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color="#0D0F14" />
            ) : (
              <Text style={modalStyles.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Create Workplace 🚀'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete Button (if editing) */}
          {isEditing && (
            <TouchableOpacity
              style={modalStyles.deleteBtn}
              onPress={handleDelete}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.deleteBtnText}>Delete Workplace</Text>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    gap: SPACING.base,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.base,
  },
  colorRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveBtnText: {
    color: '#0D0F14',
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
});
