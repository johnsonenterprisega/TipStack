export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro';
          pay_period_start_day: number;
          pay_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro';
          pay_period_start_day?: number;
          pay_day?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro';
          pay_period_start_day?: number;
          pay_day?: number;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string | null;
          hourly_wage: number;
          tip_out_percent: number;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          role?: string | null;
          hourly_wage?: number;
          tip_out_percent?: number;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          role?: string | null;
          hourly_wage?: number;
          tip_out_percent?: number;
          color?: string;
          is_active?: boolean;
        };
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          hours_worked: number;
          cash_tips: number;
          credit_tips: number;
          tip_out_amount: number;
          net_tips: number;
          total_earnings: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          hours_worked?: number;
          cash_tips?: number;
          credit_tips?: number;
          tip_out_amount?: number;
          net_tips?: number;
          total_earnings?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date?: string;
          start_time?: string | null;
          end_time?: string | null;
          hours_worked?: number;
          cash_tips?: number;
          credit_tips?: number;
          tip_out_amount?: number;
          net_tips?: number;
          total_earnings?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          criteria_type: string;
          criteria_value: number;
          tier: 'bronze' | 'silver' | 'gold' | 'platinum';
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          criteria_type: string;
          criteria_value: number;
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
        };
        Update: Record<string, never>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: Record<string, never>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: 'daily' | 'weekly' | 'monthly';
          target_amount: number;
          period_label: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'daily' | 'weekly' | 'monthly';
          target_amount: number;
          period_label: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          target_amount?: number;
          is_active?: boolean;
        };
      };
    };
  };
}
