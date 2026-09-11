export interface ParsedShiftRow {
  date: string; // YYYY-MM-DD
  hours_worked: number;
  cash_tips: number;
  credit_tips: number;
  tip_out_amount: number;
  total_earnings: number;
  job_name?: string;
  notes?: string;
}

export interface MigrationSummary {
  detectedApp: string;
  totalShifts: number;
  totalEarnings: number;
  startDate: string;
  endDate: string;
  sampleRows: ParsedShiftRow[];
  parsedShifts: ParsedShiftRow[];
}

export const migrationService = {
  /**
   * Parses CSV string into structured shift rows with flexible fuzzy column matching.
   */
  parseCSV(csvText: string): MigrationSummary {
    const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length < 2) {
      throw new Error('The CSV file does not contain enough data or header rows.');
    }

    // Parse header row
    const headers = this.parseCSVLine(rawLines[0]).map((h) => h.toLowerCase().trim());

    // Map column indices
    let dateIdx = -1;
    let hoursIdx = -1;
    let cashIdx = -1;
    let creditIdx = -1;
    let tipOutIdx = -1;
    let wageIdx = -1;
    let totalIdx = -1;
    let jobIdx = -1;
    let notesIdx = -1;

    let detectedApp = 'Standard Spreadsheet';

    headers.forEach((h, idx) => {
      if (h.includes('date') || h.includes('day') || h === 'when') dateIdx = idx;
      else if (h.includes('hour') || h === 'duration' || h === 'time' || h === 'hrs') hoursIdx = idx;
      else if (h.includes('cash')) cashIdx = idx;
      else if (h.includes('credit') || h.includes('card') || h.includes('charge')) creditIdx = idx;
      else if (h.includes('tipout') || h.includes('tip out') || h.includes('tip_out') || h.includes('cut')) tipOutIdx = idx;
      else if (h.includes('wage') || h.includes('rate') || h.includes('base')) wageIdx = idx;
      else if (h.includes('total') || h.includes('net') || h.includes('income') || h.includes('earnings')) totalIdx = idx;
      else if (h.includes('job') || h.includes('workplace') || h.includes('restaurant') || h.includes('role') || h.includes('location')) jobIdx = idx;
      else if (h.includes('note') || h.includes('memo') || h.includes('comment')) notesIdx = idx;
    });

    // Detect app format fingerprint
    const headerStr = headers.join(' ');
    if (headerStr.includes('serverlife') || (jobIdx !== -1 && wageIdx !== -1 && tipOutIdx !== -1)) {
      detectedApp = 'ServerLife';
    } else if (headerStr.includes('tipsee') || (cashIdx !== -1 && creditIdx !== -1 && tipOutIdx !== -1 && totalIdx !== -1)) {
      detectedApp = 'TipSee';
    } else if (headerStr.includes('tipkeep')) {
      detectedApp = 'TipKeep';
    }

    if (dateIdx === -1 && cashIdx === -1 && creditIdx === -1 && totalIdx === -1) {
      throw new Error('Could not identify date or tip columns in the CSV. Please ensure standard column headers exist.');
    }

    const parsedShifts: ParsedShiftRow[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      const cols = this.parseCSVLine(line);
      if (cols.length === 0) continue;

      const rawDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : '';
      const cleanDate = this.normalizeDate(rawDate);
      if (!cleanDate) continue;

      const hours = hoursIdx !== -1 && cols[hoursIdx] ? this.parseNumber(cols[hoursIdx]) : 6.0;
      const cash = cashIdx !== -1 && cols[cashIdx] ? this.parseNumber(cols[cashIdx]) : 0;
      const credit = creditIdx !== -1 && cols[creditIdx] ? this.parseNumber(cols[creditIdx]) : 0;
      const tipOut = tipOutIdx !== -1 && cols[tipOutIdx] ? this.parseNumber(cols[tipOutIdx]) : 0;
      const wage = wageIdx !== -1 && cols[wageIdx] ? this.parseNumber(cols[wageIdx]) : 0;
      const rawTotal = totalIdx !== -1 && cols[totalIdx] ? this.parseNumber(cols[totalIdx]) : 0;

      let totalEarnings = rawTotal;
      if (totalEarnings === 0) {
        totalEarnings = Math.max(0, cash + credit - tipOut + (hours * wage));
      }

      const jobName = jobIdx !== -1 && cols[jobIdx] ? cols[jobIdx].trim() : undefined;
      const notes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx].trim() : undefined;

      parsedShifts.push({
        date: cleanDate,
        hours_worked: hours,
        cash_tips: cash,
        credit_tips: credit,
        tip_out_amount: tipOut,
        total_earnings: totalEarnings,
        job_name: jobName,
        notes: notes,
      });
    }

    if (parsedShifts.length === 0) {
      throw new Error('No valid shifts could be extracted from this file. Please verify date and tip formats.');
    }

    // Sort by date ascending
    parsedShifts.sort((a, b) => a.date.localeCompare(b.date));

    const totalEarnings = parsedShifts.reduce((acc, s) => acc + s.total_earnings, 0);
    const startDate = parsedShifts[0].date;
    const endDate = parsedShifts[parsedShifts.length - 1].date;

    return {
      detectedApp,
      totalShifts: parsedShifts.length,
      totalEarnings,
      startDate,
      endDate,
      sampleRows: parsedShifts.slice(0, 5),
      parsedShifts,
    };
  },

  /**
   * Helper to parse comma separated line respecting quotes
   */
  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result.map((r) => r.replace(/^"|"$/g, ''));
  },

  /**
   * Normalizes dates (YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, etc.) into YYYY-MM-DD.
   */
  normalizeDate(raw: string): string | null {
    if (!raw) return null;
    const clean = raw.trim().replace(/^"|"$/g, '');

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // MM/DD/YYYY or MM-DD-YYYY
    const mdy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdy) {
      const month = mdy[1].padStart(2, '0');
      const day = mdy[2].padStart(2, '0');
      const year = mdy[3];
      return `${year}-${month}-${day}`;
    }

    // YYYY/MM/DD
    const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, '0');
      const day = ymd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Fallback try native parse
    const timestamp = Date.parse(clean);
    if (!isNaN(timestamp)) {
      const d = new Date(timestamp);
      return d.toISOString().split('T')[0];
    }

    return null;
  },

  parseNumber(val: string): number {
    if (!val) return 0;
    const clean = val.replace(/[\$,]/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  },
};
