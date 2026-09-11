import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useShiftStore, useJobStore } from '../store';
import { shiftService, jobService, tipCalculator } from '../services/api';
import { adService } from '../services/adService';
import ShiftFlexModal from './ShiftFlexModal';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';
import { Database } from '../types/database';
import { format } from 'date-fns';

type Shift = Database['public']['Tables']['shifts']['Row'];

interface ShiftModalProps {
  visible: boolean;
  shiftToEdit?: Shift | null;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ShiftModal({
  visible,
  shiftToEdit,
  defaultDate,
  onClose,
  onSaved,
}: ShiftModalProps) {
  const { session } = useAuthStore();
  const { jobs, addJob } = useJobStore();
  const { addShift, updateShift, removeShift } = useShiftStore();

  const isEditing = !!shiftToEdit;

  const [cashTips, setCashTips] = useState('');
  const [creditTips, setCreditTips] = useState('');
  const [hours, setHours] = useState('');
  const [tipOut, setTipOut] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlexOpen, setIsFlexOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state on open or when shiftToEdit changes
  useEffect(() => {
    if (visible) {
      setErrorMsg('');
      if (shiftToEdit) {
        setCashTips(shiftToEdit.cash_tips ? shiftToEdit.cash_tips.toString() : '');
        setCreditTips(shiftToEdit.credit_tips ? shiftToEdit.credit_tips.toString() : '');
        setHours(shiftToEdit.hours_worked ? shiftToEdit.hours_worked.toString() : '');
        setTipOut(shiftToEdit.tip_out_amount ? shiftToEdit.tip_out_amount.toString() : '');
        setNotes(shiftToEdit.notes || '');
        setSelectedJobId(shiftToEdit.job_id);
        setShiftDate(shiftToEdit.date);
      } else {
        setCashTips('');
        setCreditTips('');
        setHours('');
        setTipOut('');
        setNotes('');
        setSelectedJobId(jobs[0]?.id || '');
        setShiftDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [visible, shiftToEdit, defaultDate, jobs]);

  const activeJobId = selectedJobId || jobs[0]?.id || '';
  const selectedJob = jobs.find((j) => j.id === activeJobId);
  const totalTips = (parseFloat(cashTips) || 0) + (parseFloat(creditTips) || 0);
  const calcTipOut = tipOut
    ? parseFloat(tipOut)
    : tipCalculator.calcTipOut(totalTips, selectedJob?.tip_out_percent ?? 0);
  const netTips = tipCalculator.calcNetTips(
    parseFloat(cashTips) || 0,
    parseFloat(creditTips) || 0,
    calcTipOut
  );

  const handleSave = async () => {
    setErrorMsg('');
    if (!session?.user?.id) {
      setErrorMsg('Please sign in to save shifts.');
      return;
    }
    if (!cashTips.trim() && !creditTips.trim()) {
      setErrorMsg('Please enter cash or credit tips.');
      return;
    }

    setIsSaving(true);
    try {
      let jobIdToUse = activeJobId;

      // Auto-create a default job if user has none
      if (!jobIdToUse) {
        const { data: newJob, error: jobErr } = await jobService.createJob({
          user_id: session.user.id,
          name: 'Primary Job',
          role: 'Server / Bartender',
          hourly_wage: 5.0,
          tip_out_percent: 0,
          color: '#00C9A7',
        });
        if (jobErr || !newJob) {
          setErrorMsg(jobErr?.message || 'Could not set up workplace.');
          setIsSaving(false);
          return;
        }
        addJob(newJob as any);
        jobIdToUse = (newJob as any).id;
        setSelectedJobId((newJob as any).id);
      }

      const hoursWorked = parseFloat(hours) || 0;
      const job = jobs.find((j) => j.id === jobIdToUse) || selectedJob;
      const total = tipCalculator.calcTotalEarnings(job?.hourly_wage ?? 0, hoursWorked, netTips);

      if (isEditing && shiftToEdit) {
        // UPDATE existing shift
        const { data, error } = await shiftService.updateShift(shiftToEdit.id, {
          job_id: jobIdToUse,
          date: shiftDate || shiftToEdit.date,
          hours_worked: hoursWorked,
          cash_tips: parseFloat(cashTips) || 0,
          credit_tips: parseFloat(creditTips) || 0,
          tip_out_amount: calcTipOut,
          net_tips: netTips,
          total_earnings: total,
          notes: notes.trim() || null,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          updateShift(data.id, data);
          if (Platform.OS !== 'web') {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
          }
          onSaved();
          onClose();
          setTimeout(() => {
            adService.recordTaskAndShowInterstitial(
              useAuthStore.getState().profile?.subscription_tier === 'pro',
              'update_shift'
            );
          }, 450);
        }
      } else {
        // CREATE new shift
        const { data, error } = await shiftService.createShift({
          user_id: session.user.id,
          job_id: jobIdToUse,
          date: shiftDate || format(new Date(), 'yyyy-MM-dd'),
          hours_worked: hoursWorked,
          cash_tips: parseFloat(cashTips) || 0,
          credit_tips: parseFloat(creditTips) || 0,
          tip_out_amount: calcTipOut,
          net_tips: netTips,
          total_earnings: total,
          notes: notes.trim() || null,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          addShift(data);
          if (Platform.OS !== 'web') {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
          }
          onSaved();
          onClose();
          setTimeout(() => {
            adService.recordTaskAndShowInterstitial(
              useAuthStore.getState().profile?.subscription_tier === 'pro',
              'create_shift'
            );
          }, 450);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!shiftToEdit) return;

    const doDelete = async () => {
      setIsDeleting(true);
      try {
        const { error } = await shiftService.deleteShift(shiftToEdit.id);
        if (error) {
          setErrorMsg(error.message);
        } else {
          removeShift(shiftToEdit.id);
          if (Platform.OS !== 'web') {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
          }
          onSaved();
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Could not delete shift.');
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this shift? This cannot be undone.')) {
        doDelete();
      }
    } else {
      Alert.alert(
        '🗑️ Delete Shift',
        'Are you sure you want to delete this shift record? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const formattedDate = shiftDate
    ? format(new Date(shiftDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')
    : format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.lg }}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>{isEditing ? '✏️ Edit Shift' : '⚡ Quick Log'}</Text>
            <Text style={modalStyles.date}>{formattedDate}</Text>

            {errorMsg ? (
              <View style={modalStyles.errorBox}>
                <Text style={modalStyles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Workplace Selector */}
            {jobs.length > 1 && (
              <View style={modalStyles.inputWrap}>
                <Text style={modalStyles.inputLabel}>Workplace</Text>
                <View style={modalStyles.jobRow}>
                  {jobs.map((job) => {
                    const isSelected = job.id === activeJobId;
                    return (
                      <TouchableOpacity
                        key={job.id}
                        style={[
                          modalStyles.jobChip,
                          isSelected && { borderColor: job.color, backgroundColor: job.color + '22' },
                        ]}
                        onPress={() => setSelectedJobId(job.id)}
                      >
                        <View style={[modalStyles.jobDot, { backgroundColor: job.color }]} />
                        <Text style={[modalStyles.jobChipText, isSelected && { color: COLORS.textPrimary, fontWeight: '700' }]}>
                          {job.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Tips Inputs */}
            <View style={modalStyles.row}>
              <View style={[modalStyles.inputWrap, { flex: 1 }]}>
                <Text style={modalStyles.inputLabel}>💵 Cash Tips ($)</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={cashTips}
                  onChangeText={setCashTips}
                />
              </View>
              <View style={[modalStyles.inputWrap, { flex: 1 }]}>
                <Text style={modalStyles.inputLabel}>💳 Credit Tips ($)</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={creditTips}
                  onChangeText={setCreditTips}
                />
              </View>
            </View>

            {/* Hours and Tip-Out */}
            <View style={modalStyles.row}>
              <View style={[modalStyles.inputWrap, { flex: 1 }]}>
                <Text style={modalStyles.inputLabel}>⏱️ Hours Worked</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={hours}
                  onChangeText={setHours}
                />
              </View>
              <View style={[modalStyles.inputWrap, { flex: 1 }]}>
                <Text style={modalStyles.inputLabel}>
                  🤝 Tip-Out ($)
                  {selectedJob?.tip_out_percent ? ` (${selectedJob.tip_out_percent}%)` : ''}
                </Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder={calcTipOut > 0 ? calcTipOut.toFixed(2) : '0.00'}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={tipOut}
                  onChangeText={setTipOut}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={modalStyles.inputWrap}>
              <Text style={modalStyles.inputLabel}>📝 Notes (Optional)</Text>
              <TextInput
                style={[modalStyles.input, { height: 44 }]}
                placeholder="e.g. Busy Friday night patio shift"
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Live Net Preview */}
            <View style={modalStyles.previewCard}>
              <Text style={modalStyles.previewLabel}>Net Take-Home Tips</Text>
              <Text style={modalStyles.previewAmount}>{tipCalculator.formatCurrency(netTips)}</Text>
              {hours ? (
                <Text style={modalStyles.previewRate}>
                  ≈ {tipCalculator.formatCurrency(tipCalculator.calcTipPerHour(netTips, parseFloat(hours) || 1))}/hr in tips
                </Text>
              ) : null}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[modalStyles.saveButton, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving || isDeleting}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#0D0F14" />
              ) : (
                <Text style={modalStyles.saveButtonText}>
                  {isEditing ? 'Update Shift 💾' : 'Save Shift 💰'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Share Flex Story Button (when editing) */}
            {isEditing && shiftToEdit && (
              <TouchableOpacity
                style={modalStyles.flexButton}
                onPress={() => setIsFlexOpen(true)}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.flexButtonText}>📸 Share Shift Flex Story</Text>
              </TouchableOpacity>
            )}

            {/* Delete Button (when editing) */}
            {isEditing && (
              <TouchableOpacity
                style={[modalStyles.deleteButton, isDeleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={isSaving || isDeleting}
                activeOpacity={0.85}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.error} />
                ) : (
                  <Text style={modalStyles.deleteButtonText}>🗑️ Delete Shift</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton} disabled={isSaving || isDeleting}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Shift Flex Story Modal */}
      {shiftToEdit && (
        <ShiftFlexModal
          visible={isFlexOpen}
          shift={shiftToEdit}
          onClose={() => setIsFlexOpen(false)}
        />
      )}
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  date: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.base },
  errorBox: {
    backgroundColor: '#FF6B6B22',
    borderColor: COLORS.error,
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', gap: SPACING.sm },
  inputWrap: { marginBottom: SPACING.base },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  jobRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  jobChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  jobDot: { width: 8, height: 8, borderRadius: 4 },
  jobChipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  previewCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  previewLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  previewAmount: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  previewRate: { fontSize: FONT_SIZES.xs, color: COLORS.accent, marginTop: 2, fontWeight: '600' },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.glow,
  },
  saveButtonText: { fontSize: FONT_SIZES.base, fontWeight: '800', color: '#0D0F14' },
  flexButton: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  flexButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.accent,
  },
  deleteButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.error + '55',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deleteButtonText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.error },
  cancelButton: { alignItems: 'center', paddingVertical: SPACING.xs },
  cancelText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
});
