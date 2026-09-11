import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  setYear,
  setMonth,
  parseISO,
} from 'date-fns';
import { useShiftStore, useJobStore } from '../../src/store';
import { tipCalculator } from '../../src/services/api';
import ShiftModal from '../../src/components/ShiftModal';
import ShiftFlexModal from '../../src/components/ShiftFlexModal';
import { useAppTheme } from '../../src/store/themeStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../src/theme';
import { Database } from '../../src/types/database';

type Shift = Database['public']['Tables']['shifts']['Row'];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getHeatColor(amount: number, maxAmount: number, primaryColor: string = COLORS.primary, surfaceColor: string = COLORS.surface): string {
  if (amount === 0) return surfaceColor;
  const intensity = Math.min(amount / maxAmount, 1);
  if (intensity < 0.25) return primaryColor + '44';
  if (intensity < 0.5) return primaryColor + '88';
  if (intensity < 0.75) return primaryColor + 'BB';
  return primaryColor;
}

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const { shifts } = useShiftStore();
  const { jobs } = useJobStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isShiftModalVisible, setIsShiftModalVisible] = useState(false);
  const [flexShift, setFlexShift] = useState<Shift | null>(null);
  const [isFlexModalVisible, setIsFlexModalVisible] = useState(false);

  // Search & Jump Modal State
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpYear, setJumpYear] = useState(currentMonth.getFullYear());
  const [activeTab, setActiveTab] = useState<'jump' | 'search'>('jump');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Map: date string -> total net tips
  const tipsByDate: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const shift of shifts) {
      map[shift.date] = (map[shift.date] || 0) + shift.net_tips;
    }
    return map;
  }, [shifts]);

  const maxTips = useMemo(() => Math.max(...Object.values(tipsByDate), 1), [tipsByDate]);

  // Current Month Summary Stats
  const currentMonthPrefix = format(currentMonth, 'yyyy-MM');
  const currentMonthShifts = useMemo(
    () => shifts.filter((s) => s.date.startsWith(currentMonthPrefix)),
    [shifts, currentMonthPrefix]
  );
  const currentMonthTotalTips = useMemo(
    () => currentMonthShifts.reduce((acc, s) => acc + s.net_tips, 0),
    [currentMonthShifts]
  );
  const currentMonthBestShift = useMemo(() => {
    if (currentMonthShifts.length === 0) return null;
    return [...currentMonthShifts].sort((a, b) => b.net_tips - a.net_tips)[0];
  }, [currentMonthShifts]);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedShifts = selectedDateStr
    ? shifts.filter((s) => s.date === selectedDateStr)
    : [];

  // Filter shifts based on search query
  const filteredShifts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return shifts.slice(0, 25);

    return shifts.filter((s) => {
      const job = jobs.find((j) => j.id === s.job_id);
      const jobName = job?.name.toLowerCase() || '';
      const notes = s.notes?.toLowerCase() || '';
      const dateStr = s.date.toLowerCase();
      const formattedDate = format(parseISO(s.date), 'EEEE MMMM d yyyy').toLowerCase();
      const amountStr = s.net_tips.toString();

      return (
        dateStr.includes(q) ||
        formattedDate.includes(q) ||
        jobName.includes(q) ||
        notes.includes(q) ||
        amountStr.includes(q)
      );
    });
  }, [shifts, jobs, searchQuery]);

  // Handle Month/Year Jump
  const handleSelectMonthYear = (monthIdx: number, year: number) => {
    const updated = setMonth(setYear(new Date(), year), monthIdx);
    setCurrentMonth(updated);
    setSelectedDate(startOfMonth(updated));
    setIsSearchModalVisible(false);
  };

  // Jump to specific shift from search result
  const handleJumpToShift = (shift: Shift) => {
    const targetDate = parseISO(shift.date);
    setCurrentMonth(targetDate);
    setSelectedDate(targetDate);
    setEditingShift(shift);
    setIsSearchModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Search & Quick Jump */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>📅 Shift Calendar</Text>
          <View style={styles.headerActionGroup}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                setJumpYear(currentMonth.getFullYear());
                setIsSearchModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.searchButtonText}>🔍 Jump & Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigation & Title */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setJumpYear(currentMonth.getFullYear());
              setActiveTab('jump');
              setIsSearchModalVisible(true);
            }}
            style={styles.monthTitleWrap}
            activeOpacity={0.7}
          >
            <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <Text style={styles.monthTitleArrow}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Month Overview Stats */}
        <View style={styles.monthSummaryRow}>
          <View style={styles.monthSummaryCard}>
            <Text style={styles.monthSummaryLabel}>Total Tips</Text>
            <Text style={styles.monthSummaryValue}>
              {tipCalculator.formatCurrency(currentMonthTotalTips)}
            </Text>
          </View>
          <View style={styles.monthSummaryCard}>
            <Text style={styles.monthSummaryLabel}>Shifts Worked</Text>
            <Text style={styles.monthSummaryValue}>{currentMonthShifts.length} shifts</Text>
          </View>
          <View style={styles.monthSummaryCard}>
            <Text style={styles.monthSummaryLabel}>Best Shift</Text>
            <Text style={styles.monthSummaryValue}>
              {currentMonthBestShift
                ? tipCalculator.formatCurrency(currentMonthBestShift.net_tips)
                : '—'}
            </Text>
          </View>
        </View>

        {/* Day Labels */}
        <View style={styles.weekLabels}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <Text key={d} style={styles.weekLabel}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.grid}>
          {calDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const tips = tipsByDate[dateStr] || 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isToday = isSameDay(day, new Date());
            const heatColor = tips > 0 ? getHeatColor(tips, maxTips) : 'transparent';

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  { backgroundColor: heatColor },
                  isSelected && styles.dayCellSelected,
                  isToday && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(isSelected ? null : day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.dayTextFaded,
                    isSelected && styles.dayTextSelected,
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {tips > 0 && isCurrentMonth && (
                  <Text style={styles.dayTips}>
                    ${tips >= 100 ? Math.round(tips) : tips.toFixed(0)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0.25, 0.5, 0.75, 1].map((v) => (
            <View
              key={v}
              style={[
                styles.legendDot,
                { backgroundColor: getHeatColor(v * maxTips, maxTips) },
              ]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>

        {/* Selected Day Detail */}
        {selectedDate && (
          <View style={styles.detailCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              <Text style={styles.detailTitle}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingShift(null);
                  setIsShiftModalVisible(true);
                }}
                style={styles.addShiftDayBtn}
              >
                <Text style={styles.addShiftDayBtnText}>+ Add Shift</Text>
              </TouchableOpacity>
            </View>

            {selectedShifts.length === 0 ? (
              <Text style={styles.noShiftsText}>No shifts logged this day.</Text>
            ) : (
              selectedShifts.map((shift) => {
                const job = jobs.find((j) => j.id === shift.job_id);
                return (
                  <TouchableOpacity
                    key={shift.id}
                    style={styles.detailRow}
                    onPress={() => {
                      setEditingShift(shift);
                      setIsShiftModalVisible(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.detailDot,
                        { backgroundColor: job?.color ?? COLORS.primary },
                      ]}
                    />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailJob}>{job?.name ?? 'Job'}</Text>
                      {shift.hours_worked > 0 ? (
                        <Text style={styles.detailHours}>
                          {shift.hours_worked} hours • Tap to edit ✏️
                        </Text>
                      ) : (
                        <Text style={styles.detailHours}>Tap to edit ✏️</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.detailTips}>
                        {tipCalculator.formatCurrency(shift.net_tips)}
                      </Text>
                      <TouchableOpacity
                        style={styles.calendarFlexPill}
                        onPress={(e) => {
                          e.stopPropagation();
                          setFlexShift(shift);
                          setIsFlexModalVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.calendarFlexPillText}>📸 Flex</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            {selectedShifts.length > 0 && (
              <View style={styles.detailTotal}>
                <Text style={styles.detailTotalLabel}>Day Total</Text>
                <Text style={styles.detailTotalAmount}>
                  {tipCalculator.formatCurrency(
                    selectedShifts.reduce((s, sh) => s + sh.net_tips, 0)
                  )}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Shift Create / Edit / Delete Modal */}
      <ShiftModal
        visible={isShiftModalVisible}
        shiftToEdit={editingShift}
        defaultDate={selectedDateStr || undefined}
        onClose={() => {
          setIsShiftModalVisible(false);
          setEditingShift(null);
        }}
        onSaved={() => {}}
      />

      {/* Shift Flex Story Modal */}
      <ShiftFlexModal
        visible={isFlexModalVisible}
        shift={flexShift}
        onClose={() => {
          setIsFlexModalVisible(false);
          setFlexShift(null);
        }}
      />

      {/* Date Search & Quick-Jump Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent
        presentationStyle="pageSheet"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Modal Navigation Tabs */}
            <View style={styles.modalTabRow}>
              <TouchableOpacity
                style={[styles.modalTab, activeTab === 'jump' && styles.modalTabActive]}
                onPress={() => setActiveTab('jump')}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    activeTab === 'jump' && styles.modalTabTextActive,
                  ]}
                >
                  📅 Jump to Month/Year
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTab, activeTab === 'search' && styles.modalTabActive]}
                onPress={() => setActiveTab('search')}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    activeTab === 'search' && styles.modalTabTextActive,
                  ]}
                >
                  🔍 Search Shifts
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'jump' ? (
              /* Month & Year Jump Selector */
              <View style={styles.jumpContainer}>
                {/* Year Picker */}
                <View style={styles.yearSelectorRow}>
                  <TouchableOpacity
                    style={styles.yearNavBtn}
                    onPress={() => setJumpYear((y) => y - 1)}
                  >
                    <Text style={styles.yearNavBtnText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.yearTitle}>{jumpYear}</Text>
                  <TouchableOpacity
                    style={styles.yearNavBtn}
                    onPress={() => setJumpYear((y) => y + 1)}
                  >
                    <Text style={styles.yearNavBtnText}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* 12 Months Grid */}
                <View style={styles.monthsGrid}>
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected =
                      currentMonth.getMonth() === idx &&
                      currentMonth.getFullYear() === jumpYear;
                    const isThisMonth =
                      new Date().getMonth() === idx &&
                      new Date().getFullYear() === jumpYear;

                    // Calculate tips for this specific month
                    const prefix = `${jumpYear}-${String(idx + 1).padStart(2, '0')}`;
                    const monthTips = shifts
                      .filter((s) => s.date.startsWith(prefix))
                      .reduce((acc, s) => acc + s.net_tips, 0);

                    return (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.monthChip,
                          isSelected && styles.monthChipSelected,
                          isThisMonth && !isSelected && styles.monthChipCurrent,
                        ]}
                        onPress={() => handleSelectMonthYear(idx, jumpYear)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.monthChipText,
                            isSelected && styles.monthChipTextSelected,
                          ]}
                        >
                          {name}
                        </Text>
                        {monthTips > 0 && (
                          <Text
                            style={[
                              styles.monthChipTips,
                              isSelected && styles.monthChipTipsSelected,
                            ]}
                          >
                            ${Math.round(monthTips)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* Search Input & Live Results List */
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search date, workplace, amount, notes..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  clearButtonMode="always"
                />

                <ScrollView
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.searchResultsHeader}>
                    {filteredShifts.length} {filteredShifts.length === 1 ? 'shift' : 'shifts'} found
                  </Text>

                  {filteredShifts.length === 0 ? (
                    <Text style={styles.emptySearchText}>No matching shifts found.</Text>
                  ) : (
                    filteredShifts.map((shift) => {
                      const job = jobs.find((j) => j.id === shift.job_id);
                      return (
                        <TouchableOpacity
                          key={shift.id}
                          style={styles.searchResultRow}
                          onPress={() => handleJumpToShift(shift)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.detailDot,
                              { backgroundColor: job?.color ?? COLORS.primary },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultDate}>
                              {format(parseISO(shift.date), 'EEEE, MMM d, yyyy')}
                            </Text>
                            <Text style={styles.searchResultJob}>
                              {job?.name || 'Job'} • {shift.hours_worked} hrs
                              {shift.notes ? ` • "${shift.notes}"` : ''}
                            </Text>
                          </View>
                          <Text style={styles.searchResultTips}>
                            {tipCalculator.formatCurrency(shift.net_tips)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setIsSearchModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  screenTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  headerActionGroup: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  todayButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  todayButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  searchButton: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  searchButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  monthTitleArrow: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnText: { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, lineHeight: 22 },
  monthSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  monthSummaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  monthSummaryLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  monthSummaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  weekLabels: { flexDirection: 'row', marginBottom: SPACING.xs },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    padding: 2,
    marginVertical: 1,
  },
  dayCellSelected: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    borderRadius: RADIUS.sm,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
  },
  dayText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  dayTextFaded: { color: COLORS.textMuted, opacity: 0.35 },
  dayTextSelected: { color: COLORS.accent, fontWeight: '800' },
  dayTextToday: { color: '#FFFFFF', fontWeight: '800' },
  dayTips: { fontSize: 9, fontWeight: '700', color: '#0D0F14', marginTop: 1 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  legendLabel: { fontSize: 10, color: COLORS.textMuted, marginHorizontal: 2 },
  legendDot: { width: 12, height: 12, borderRadius: 2 },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  detailTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.textPrimary },
  addShiftDayBtn: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  addShiftDayBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '700',
  },
  noShiftsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  detailDot: { width: 10, height: 10, borderRadius: 5 },
  detailInfo: { flex: 1 },
  detailJob: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  detailHours: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  detailTips: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.primary },
  calendarFlexPill: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  calendarFlexPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
  },
  detailTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  detailTotalLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary },
  detailTotalAmount: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: COLORS.accent },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  modalTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modalTabActive: {
    backgroundColor: COLORS.primary,
  },
  modalTabText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modalTabTextActive: {
    color: '#0D0F14',
    fontWeight: '800',
  },
  jumpContainer: {
    gap: SPACING.base,
  },
  yearSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  yearNavBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearNavBtnText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  yearTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  monthChip: {
    width: '31%',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  monthChipSelected: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  monthChipCurrent: {
    borderColor: COLORS.accent,
  },
  monthChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monthChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  monthChipTips: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthChipTipsSelected: {
    color: COLORS.primary,
  },
  searchContainer: {
    gap: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  searchResultsList: {
    maxHeight: 320,
  },
  searchResultsHeader: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySearchText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchResultDate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchResultJob: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  searchResultTips: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalCloseBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
