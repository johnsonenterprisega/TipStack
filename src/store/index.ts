import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, profile: null }),
}));

// ─── Shift Store ──────────────────────────────────────────────────────────────

interface ShiftState {
  shifts: Shift[];
  isLoading: boolean;
  lastFetched: Date | null;
  setShifts: (shifts: Shift[]) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  removeShift: (shiftId: string) => void;
  setLoading: (loading: boolean) => void;
  setLastFetched: (date: Date) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  shifts: [],
  isLoading: false,
  lastFetched: null,
  setShifts: (shifts) => set({ shifts }),
  addShift: (shift) =>
    set((state) => ({
      shifts: [shift, ...state.shifts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    })),
  updateShift: (shiftId, updates) =>
    set((state) => ({
      shifts: state.shifts.map((s) => (s.id === shiftId ? { ...s, ...updates } : s)),
    })),
  removeShift: (shiftId) =>
    set((state) => ({ shifts: state.shifts.filter((s) => s.id !== shiftId) })),
  setLoading: (isLoading) => set({ isLoading }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
}));

// ─── Job Store ────────────────────────────────────────────────────────────────

interface JobState {
  jobs: Job[];
  activeJobId: string | null;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
  setActiveJob: (jobId: string | null) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  activeJobId: null,
  setJobs: (jobs) => set({ jobs, activeJobId: jobs[0]?.id ?? null }),
  addJob: (job) =>
    set((state) => ({
      jobs: [...state.jobs, job],
      activeJobId: state.activeJobId ?? job.id,
    })),
  updateJob: (jobId, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    })),
  removeJob: (jobId) =>
    set((state) => {
      const filtered = state.jobs.filter((j) => j.id !== jobId);
      return {
        jobs: filtered,
        activeJobId:
          state.activeJobId === jobId ? (filtered[0]?.id ?? null) : state.activeJobId,
      };
    }),
  setActiveJob: (activeJobId) => set({ activeJobId }),
}));

// ─── Gamification Store ───────────────────────────────────────────────────────

interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  level: number;
  totalEarnings: number;
  badgeCount: number;
  setStreak: (current: number, longest: number) => void;
  setLevel: (level: number) => void;
  setTotalEarnings: (total: number) => void;
  setBadgeCount: (count: number) => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  currentStreak: 0,
  longestStreak: 0,
  level: 1,
  totalEarnings: 0,
  badgeCount: 0,
  setStreak: (currentStreak, longestStreak) => set({ currentStreak, longestStreak }),
  setLevel: (level) => set({ level }),
  setTotalEarnings: (totalEarnings) => set({ totalEarnings }),
  setBadgeCount: (badgeCount) => set({ badgeCount }),
}));
