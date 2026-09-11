import { format, subDays, addDays } from 'date-fns';

export interface DayOption {
  value: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  name: string;
  short: string;
}

export const DAYS_OF_WEEK: DayOption[] = [
  { value: 0, name: 'Sunday', short: 'Sun' },
  { value: 1, name: 'Monday', short: 'Mon' },
  { value: 2, name: 'Tuesday', short: 'Tue' },
  { value: 3, name: 'Wednesday', short: 'Wed' },
  { value: 4, name: 'Thursday', short: 'Thu' },
  { value: 5, name: 'Friday', short: 'Fri' },
  { value: 6, name: 'Saturday', short: 'Sat' },
];

/**
 * Returns the ending day of the 7-day weekly pay period.
 * (e.g. Start on Wednesday (3) -> Ends on Tuesday (2))
 */
export function getPayPeriodEndDay(startDay: number): DayOption {
  const endValue = (startDay + 6) % 7;
  return DAYS_OF_WEEK[endValue];
}

/**
 * Computes the start date, end date, and formatted label for the current pay period
 * based on the user's configured payPeriodStartDay.
 */
export function getCurrentPayPeriod(
  targetDate: Date = new Date(),
  startDay: number = 3, // default Wednesday
): {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  label: string;
  fullLabel: string;
} {
  const currentDOW = targetDate.getDay();
  const diff = (currentDOW - startDay + 7) % 7;
  const startDate = subDays(targetDate, diff);
  const endDate = addDays(startDate, 6);

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  const label = `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')}`;
  const fullLabel = `${DAYS_OF_WEEK[startDay].short}, ${format(startDate, 'MMM d')} – ${getPayPeriodEndDay(startDay).short}, ${format(endDate, 'MMM d')}`;

  return {
    startDate,
    endDate,
    startDateStr,
    endDateStr,
    label,
    fullLabel,
  };
}

/**
 * Computes status and countdown text for weekly pay day.
 */
export function getPayDayStatus(
  targetDate: Date = new Date(),
  payDay: number = 5, // default Friday
): {
  isToday: boolean;
  daysUntil: number;
  message: string;
  dayName: string;
} {
  const currentDOW = targetDate.getDay();
  const daysUntil = (payDay - currentDOW + 7) % 7;
  const dayName = DAYS_OF_WEEK[payDay]?.name ?? 'Friday';

  let message = '';
  if (daysUntil === 0) {
    message = '🎉 Today is Pay Day!';
  } else if (daysUntil === 1) {
    message = `⏳ Pay Day Tomorrow (${dayName})`;
  } else {
    message = `💰 Pay Day in ${daysUntil} days (${dayName})`;
  }

  return {
    isToday: daysUntil === 0,
    daysUntil,
    message,
    dayName,
  };
}
