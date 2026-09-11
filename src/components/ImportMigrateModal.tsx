import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { migrationService, MigrationSummary, ParsedShiftRow } from '../services/migrationService';
import { shiftService, jobService, tipCalculator } from '../services/api';
import { useAuthStore, useShiftStore, useJobStore } from '../store';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme';

interface ImportMigrateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportMigrateModal({ visible, onClose, onSuccess }: ImportMigrateModalProps) {
  const { session } = useAuthStore();
  const { setShifts } = useShiftStore();
  const { jobs } = useJobStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [summary, setSummary] = useState<MigrationSummary | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);

  const resetState = () => {
    setCsvText('');
    setSummary(null);
    setIsParsing(false);
    setIsMigrating(false);
  };

  const handlePickFile = async () => {
    try {
      setIsParsing(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
          'application/vnd.ms-excel',
          'application/csv',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setIsParsing(false);
        return;
      }

      const asset = res.assets[0];
      let content = '';

      if (Platform.OS === 'web') {
        if (asset.file) {
          content = await asset.file.text();
        } else if (asset.uri) {
          const resp = await fetch(asset.uri);
          content = await resp.text();
        }
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (!content || content.trim().length === 0) {
        throw new Error('The selected file is empty.');
      }

      const parsed = migrationService.parseCSV(content);
      setSummary(parsed);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err: any) {
      Alert.alert('CSV Parse Error', err.message || 'Could not parse the selected file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!csvText.trim()) {
      Alert.alert('Empty Input', 'Please paste CSV or spreadsheet rows before parsing.');
      return;
    }

    try {
      setIsParsing(true);
      const parsed = migrationService.parseCSV(csvText);
      setSummary(parsed);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err: any) {
      Alert.alert('Parse Error', err.message || 'Could not parse pasted data.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmMigration = async () => {
    if (!session?.user?.id || !summary) return;
    setIsMigrating(true);

    try {
      const userId = session.user.id;
      let targetJobId = selectedJobId;

      // If user doesn't have a job yet, create a default "Imported Shifts" workplace
      if (!targetJobId && jobs.length === 0) {
        const { data: newJob } = await jobService.createJob({
          user_id: userId,
          name: 'Imported Shifts',
          role: 'Tipped Pro',
          hourly_wage: 0,
          tip_out_percent: 0,
          color: COLORS.primary,
        });
        if (newJob) targetJobId = (newJob as any).id;
      }

      // Convert parsed rows to ShiftInsert schema
      const shiftPayloads = summary.parsedShifts.map((s) => ({
        user_id: userId,
        job_id: targetJobId,
        date: s.date,
        hours_worked: s.hours_worked,
        cash_tips: s.cash_tips,
        credit_tips: s.credit_tips,
        tip_out_amount: s.tip_out_amount,
        total_earnings: s.total_earnings,
        notes: s.notes ? `[Imported from ${summary.detectedApp}] ${s.notes}` : `[Imported from ${summary.detectedApp}]`,
      }));

      // Batch insert in chunks of 50 to avoid timeout
      const CHUNK_SIZE = 50;
      for (let i = 0; i < shiftPayloads.length; i += CHUNK_SIZE) {
        const chunk = shiftPayloads.slice(i, i + CHUNK_SIZE);
        const { error } = await shiftService.batchCreateShifts(chunk as any);
        if (error) throw error;
      }

      // Refresh global store
      const freshShifts = await shiftService.getShifts(userId, 300);
      setShifts(freshShifts);

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      const successMsg = `Successfully imported ${summary.totalShifts} shifts totaling ${tipCalculator.formatCurrency(summary.totalEarnings)}!`;
      if (Platform.OS === 'web') {
        window.alert(`🎉 Migration Complete!\n\n${successMsg}`);
      } else {
        Alert.alert('🎉 Migration Complete!', successMsg);
      }

      resetState();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Migration Failed', err.message || 'Could not save imported shifts.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.dragBar} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIconCircle}>
                <Text style={{ fontSize: 28 }}>📥</Text>
              </View>
              <Text style={styles.title}>Migrate Old Shifts</Text>
              <Text style={styles.subtitle}>
                Switching from another tracker? Import your CSV or spreadsheet records in seconds.
              </Text>
            </View>

            {/* Compatible Apps Badges */}
            <View style={styles.compatBadgesRow}>
              {['ServerLife', 'TipSee', 'TipKeep', 'Excel / CSV'].map((app) => (
                <View key={app} style={styles.compatBadge}>
                  <Text style={styles.compatBadgeText}>{app}</Text>
                </View>
              ))}
            </View>

            {/* Tabs */}
            {!summary && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('upload')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}>
                    📁 Upload CSV File
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'paste' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('paste')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'paste' && styles.tabBtnTextActive]}>
                    📋 Paste CSV Text
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Content: File Picker */}
            {!summary && activeTab === 'upload' && (
              <View style={styles.uploadBoxWrap}>
                <TouchableOpacity
                  style={styles.uploadDropzone}
                  onPress={handlePickFile}
                  disabled={isParsing}
                  activeOpacity={0.85}
                >
                  {isParsing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  ) : (
                    <>
                      <Text style={{ fontSize: 44, marginBottom: SPACING.sm }}>📄</Text>
                      <Text style={styles.uploadDropTitle}>Select CSV or Spreadsheet File</Text>
                      <Text style={styles.uploadDropSub}>
                        Export your records from ServerLife, TipSee, or Excel and tap here to upload.
                      </Text>
                      <View style={styles.browsePill}>
                        <Text style={styles.browsePillText}>Browse Files</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Content: Paste Text */}
            {!summary && activeTab === 'paste' && (
              <View style={styles.pasteWrap}>
                <TextInput
                  style={styles.pasteInput}
                  multiline
                  placeholder="Paste your CSV data here...&#10;Example:&#10;Date,Hours,Cash,Credit,TipOut,Total&#10;2026-08-10,7,40,165,15,190&#10;2026-08-11,6.5,50,210,20,240"
                  placeholderTextColor={COLORS.textMuted}
                  value={csvText}
                  onChangeText={setCsvText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.parseBtn, isParsing && { opacity: 0.6 }]}
                  onPress={handleParsePastedText}
                  disabled={isParsing}
                  activeOpacity={0.85}
                >
                  {isParsing ? (
                    <ActivityIndicator color="#0D0F14" />
                  ) : (
                    <Text style={styles.parseBtnText}>Preview & Verify Data  →</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Summary Preview Screen */}
            {summary && (
              <View style={styles.previewContainer}>
                {/* Detected App Tag */}
                <View style={styles.detectedBanner}>
                  <Text style={styles.detectedBannerText}>
                    ✨ DETECTED FORMAT: {summary.detectedApp.toUpperCase()}
                  </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{summary.totalShifts}</Text>
                    <Text style={styles.statLabel}>Shifts Found</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: COLORS.primary }]}>
                      {tipCalculator.formatCurrency(summary.totalEarnings)}
                    </Text>
                    <Text style={styles.statLabel}>Historical Tips</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {summary.startDate.slice(5)} - {summary.endDate.slice(5)}
                    </Text>
                    <Text style={styles.statLabel}>Date Span</Text>
                  </View>
                </View>

                {/* Target Workplace Assignment */}
                {jobs.length > 0 && (
                  <View style={styles.jobSelectWrap}>
                    <Text style={styles.jobSelectLabel}>Assign shifts to workplace:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {jobs.map((j) => (
                        <TouchableOpacity
                          key={j.id}
                          style={[
                            styles.jobPill,
                            selectedJobId === j.id && styles.jobPillActive,
                          ]}
                          onPress={() => setSelectedJobId(j.id)}
                          activeOpacity={0.8}
                        >
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: j.color || COLORS.primary }} />
                          <Text style={[styles.jobPillText, selectedJobId === j.id && { color: '#0D0F14', fontWeight: '800' }]}>
                            {j.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Sample Records Table */}
                <Text style={styles.sampleTitle}>SAMPLE EXTRACTED SHIFTS (FIRST 5):</Text>
                <View style={styles.sampleTable}>
                  <View style={styles.sampleHeaderRow}>
                    <Text style={[styles.sampleColHeader, { width: '28%' }]}>Date</Text>
                    <Text style={[styles.sampleColHeader, { width: '18%' }]}>Hours</Text>
                    <Text style={[styles.sampleColHeader, { width: '24%' }]}>Tips</Text>
                    <Text style={[styles.sampleColHeader, { width: '30%', textAlign: 'right' }]}>Total</Text>
                  </View>

                  {summary.sampleRows.map((r, idx) => (
                    <View key={idx} style={styles.sampleDataRow}>
                      <Text style={[styles.sampleDataCell, { width: '28%' }]}>{r.date}</Text>
                      <Text style={[styles.sampleDataCell, { width: '18%' }]}>{r.hours_worked}h</Text>
                      <Text style={[styles.sampleDataCell, { width: '24%', color: COLORS.accent }]}>
                        ${Math.round(r.cash_tips + r.credit_tips)}
                      </Text>
                      <Text style={[styles.sampleDataCell, { width: '30%', textAlign: 'right', color: COLORS.primary, fontWeight: '700' }]}>
                        ${Math.round(r.total_earnings)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.confirmBtn, isMigrating && { opacity: 0.7 }]}
                  onPress={handleConfirmMigration}
                  disabled={isMigrating}
                  activeOpacity={0.88}
                >
                  {isMigrating ? (
                    <ActivityIndicator color="#0D0F14" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Migrate {summary.totalShifts} Shifts to TipStack 🚀
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelPreviewBtn}
                  onPress={() => setSummary(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelPreviewBtnText}>Choose Another File</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Cancel / Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#11141A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    borderWidth: 1,
    borderColor: '#272C3A',
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#3F4556',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8B91A7',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  compatBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  compatBadge: {
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  compatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: '#272C3A',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B91A7',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  uploadBoxWrap: {
    marginBottom: SPACING.lg,
  },
  uploadDropzone: {
    backgroundColor: '#161920',
    borderWidth: 2,
    borderColor: COLORS.primary + '44',
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  uploadDropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadDropSub: {
    fontSize: 12,
    color: '#8B91A7',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  browsePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  browsePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0F14',
  },
  pasteWrap: {
    marginBottom: SPACING.lg,
  },
  pasteInput: {
    height: 160,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  parseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  parseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D0F14',
  },
  previewContainer: {
    marginBottom: SPACING.lg,
  },
  detectedBanner: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '55',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  detectedBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.base,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#8B91A7',
    fontWeight: '600',
  },
  jobSelectWrap: {
    marginBottom: SPACING.base,
  },
  jobSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B91A7',
    marginBottom: 6,
  },
  jobPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  jobPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  jobPillText: {
    fontSize: 12,
    color: '#F0F2F8',
    fontWeight: '600',
  },
  sampleTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B91A7',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sampleTable: {
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sampleHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#272C3A',
    paddingBottom: 6,
    marginBottom: 6,
  },
  sampleColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B91A7',
    textTransform: 'uppercase',
  },
  sampleDataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  sampleDataCell: {
    fontSize: 11,
    color: '#F0F2F8',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.glow,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0D0F14',
  },
  cancelPreviewBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelPreviewBtnText: {
    fontSize: 13,
    color: '#8B91A7',
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#8B91A7',
  },
});
