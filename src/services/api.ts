import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  async signUp(email: string, password: string, username: string, extraData: Record<string, any> = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, ...extraData },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signInWithGoogle() {
    const redirectUrl =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin + '/(tabs)/home'
        : 'tipstack://auth/callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    return { data, error };
  },

  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'tipstack://auth/callback',
      },
    });
    return { data, error };
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' ? window.location.origin + '/(auth)/reset-password' : 'tipstack://auth/reset-password',
    });
    return { data, error };
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await (supabase.from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobService = {
  async getJobs(userId: string): Promise<Job[]> {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    return data ?? [];
  },

  async createJob(job: JobInsert) {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job as any)
      .select()
      .single();
    return { data, error };
  },

  async updateJob(jobId: string, updates: Partial<Job>) {
    const { data, error } = await (supabase.from('jobs') as any)
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();
    return { data, error };
  },

  async deleteJob(jobId: string) {
    const { error } = await (supabase.from('jobs') as any)
      .update({ is_active: false })
      .eq('id', jobId);
    return { error };
  },
};

// ─── Shifts ───────────────────────────────────────────────────────────────────

export const shiftService = {
  async getShifts(userId: string, limit = 100): Promise<Shift[]> {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    return data ?? [];
  },

  async getShiftsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Shift[]> {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    return data ?? [];
  },

  async createShift(shift: ShiftInsert) {
    const { net_tips, ...insertPayload } = shift as any;
    // Try inserting without generated column first
    const { data, error } = await supabase
      .from('shifts')
      .insert(insertPayload)
      .select()
      .single();
    
    if (error) {
      // Fallback in case net_tips is a regular column
      const fallback = await supabase
        .from('shifts')
        .insert(shift as any)
        .select()
        .single();
      return fallback;
    }
    return { data, error };
  },

  async batchCreateShifts(shifts: ShiftInsert[]) {
    if (shifts.length === 0) return { data: [], error: null };

    const payloads = shifts.map((s) => {
      const { net_tips, ...rest } = s as any;
      return rest;
    });

    const { data, error } = await supabase
      .from('shifts')
      .insert(payloads as any)
      .select();

    if (error) {
      // Fallback with original objects
      const fallback = await supabase
        .from('shifts')
        .insert(shifts as any)
        .select();
      return fallback;
    }
    return { data, error };
  },

  async updateShift(shiftId: string, updates: Partial<Shift>) {
    const { data, error } = await (supabase.from('shifts') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', shiftId)
      .select()
      .single();
    return { data, error };
  },

  async deleteShift(shiftId: string) {
    const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
    return { error };
  },

  async getTodayShifts(userId: string): Promise<Shift[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getShiftsByDateRange(userId, today, today);
  },
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const goalService = {
  async getGoals(userId: string): Promise<Goal[]> {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return data ?? [];
  },

  async saveGoal(goal: GoalInsert) {
    const { data, error } = await (supabase.from('goals') as any)
      .insert(goal)
      .select()
      .single();
    return { data, error };
  },

  async updateGoal(goalId: string, updates: Partial<Goal>) {
    const { data, error } = await (supabase.from('goals') as any)
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();
    return { data, error };
  },

  async deleteGoal(goalId: string) {
    const { error } = await (supabase.from('goals') as any)
      .update({ is_active: false })
      .eq('id', goalId);
    return { error };
  },
};

// ─── Export & Tax Reporting ──────────────────────────────────────────────────

export const exportService = {
  /**
   * Generates a standard CSV formatted string from shift history.
   */
  generateCSV(shifts: Shift[], jobs: Job[]): string {
    const jobMap = new Map<string, Job>();
    jobs.forEach((j) => jobMap.set(j.id, j));

    const headers = [
      'Date',
      'Workplace',
      'Role',
      'Hours Worked',
      'Cash Tips ($)',
      'Credit Tips ($)',
      'Tip-Out Paid ($)',
      'Net Tips ($)',
      'Base Wage ($/hr)',
      'Wage Earnings ($)',
      'Total Earnings ($)',
      'Notes',
    ];

    const rows = shifts.map((shift) => {
      const job = jobMap.get(shift.job_id);
      const hourlyWage = job?.hourly_wage ?? 0;
      const wageEarnings = +(hourlyWage * (shift.hours_worked || 0)).toFixed(2);
      const notes = (shift.notes || '').replace(/"/g, '""');

      return [
        `"${shift.date}"`,
        `"${job?.name || 'Unknown'}"`,
        `"${job?.role || ''}"`,
        (shift.hours_worked || 0).toFixed(2),
        (shift.cash_tips || 0).toFixed(2),
        (shift.credit_tips || 0).toFixed(2),
        (shift.tip_out_amount || 0).toFixed(2),
        (shift.net_tips || 0).toFixed(2),
        hourlyWage.toFixed(2),
        wageEarnings.toFixed(2),
        (shift.total_earnings || 0).toFixed(2),
        `"${notes}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Calculates comprehensive tax summary and optional 2025 "No Tax on Tips" estimation.
   */
  calculateTaxSummary(shifts: Shift[], jobs: Job[], taxRate = 0.20) {
    const jobMap = new Map<string, Job>();
    jobs.forEach((j) => jobMap.set(j.id, j));

    let totalHours = 0;
    let totalCashTips = 0;
    let totalCreditTips = 0;
    let totalTipOut = 0;
    let totalNetTips = 0;
    let totalWages = 0;
    let totalGrossIncome = 0;

    shifts.forEach((s) => {
      const job = jobMap.get(s.job_id);
      const hours = s.hours_worked || 0;
      const wage = job?.hourly_wage ?? 0;
      const wages = +(wage * hours).toFixed(2);

      totalHours += hours;
      totalCashTips += s.cash_tips || 0;
      totalCreditTips += s.credit_tips || 0;
      totalTipOut += s.tip_out_amount || 0;
      totalNetTips += s.net_tips || 0;
      totalWages += wages;
      totalGrossIncome += s.total_earnings || 0;
    });

    const standardEstimatedTax = +(totalGrossIncome * taxRate).toFixed(2);
    // Under "No Tax on Tips", only base hourly wages are taxed at federal level
    const noTaxOnTipsEstimatedTax = +(totalWages * taxRate).toFixed(2);
    const estimatedSavings = +(standardEstimatedTax - noTaxOnTipsEstimatedTax).toFixed(2);

    return {
      totalHours: +totalHours.toFixed(2),
      totalCashTips: +totalCashTips.toFixed(2),
      totalCreditTips: +totalCreditTips.toFixed(2),
      totalTipOut: +totalTipOut.toFixed(2),
      totalNetTips: +totalNetTips.toFixed(2),
      totalWages: +totalWages.toFixed(2),
      totalGrossIncome: +totalGrossIncome.toFixed(2),
      standardEstimatedTax,
      noTaxOnTipsEstimatedTax,
      estimatedSavings,
    };
  },
};

// ─── Tip Calculations ─────────────────────────────────────────────────────────

export const tipCalculator = {
  /** Calculate net tips after tip-out */
  calcNetTips(cashTips: number, creditTips: number, tipOutAmount: number): number {
    return Math.max(0, cashTips + creditTips - tipOutAmount);
  },

  /** Auto-calculate tip-out from total based on percentage */
  calcTipOut(totalTips: number, tipOutPercent: number): number {
    return +(totalTips * (tipOutPercent / 100)).toFixed(2);
  },

  /** Calculate hourly tip rate */
  calcTipPerHour(netTips: number, hoursWorked: number): number {
    if (hoursWorked === 0) return 0;
    return +(netTips / hoursWorked).toFixed(2);
  },

  /** Calculate total earnings including base wage */
  calcTotalEarnings(hourlyWage: number, hoursWorked: number, netTips: number): number {
    return +(hourlyWage * hoursWorked + netTips).toFixed(2);
  },

  /** Estimate tax withholding (simplified effective rate estimate) */
  calcEstimatedTax(netTips: number, taxRate = 0.15): number {
    return +(netTips * taxRate).toFixed(2);
  },

  /** Format currency */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  },
};
