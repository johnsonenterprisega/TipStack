/**
 * Utility functions for parsing clock-in and clock-out times and calculating shift duration.
 */

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (meridiem) {
    const med = meridiem.toUpperCase();
    if (med === 'PM' && hours < 12) hours += 12;
    if (med === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}

export interface ShiftHoursResult {
  hours: number;
  formatted: string;
  isOvernight: boolean;
}

export function calcShiftHours(startStr: string, endStr: string): ShiftHoursResult | null {
  const startMin = parseTimeToMinutes(startStr);
  const endMin = parseTimeToMinutes(endStr);
  if (startMin === null || endMin === null) return null;

  let diff = endMin - startMin;
  let isOvernight = false;

  if (diff < 0) {
    diff += 24 * 60; // Rollover past midnight
    isOvernight = true;
  } else if (diff === 0) {
    return { hours: 0, formatted: '0h 0m', isOvernight: false };
  }

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  const totalHours = +(diff / 60).toFixed(2);

  return {
    hours: totalHours,
    formatted: `${h}h ${m > 0 ? m + 'm' : ''}`.trim(),
    isOvernight,
  };
}

export function to24HourTime(timeStr: string): string | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  if (meridiem) {
    const med = meridiem.toUpperCase();
    if (med === 'PM' && hours < 12) hours += 12;
    if (med === 'AM' && hours === 12) hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${m}:00`;
}

export function from24HourTime(time24: string | null | undefined): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return '';
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${meridiem}`;
}
