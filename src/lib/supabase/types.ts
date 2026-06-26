// Generated from supabase/migrations/20260625000000_create_users.sql
// TODO: replace with output of `npx supabase gen types typescript --local` after connecting a local stack

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          avatar_color: string
          avatar_emoji: string
          created_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          nickname: string
          avatar_color: string
          avatar_emoji: string
          created_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          avatar_color?: string
          avatar_emoji?: string
          created_at?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: { id: string; title: string; body: string | null; emoji: string | null; created_by: string; pinned: boolean; created_at: string }
        Insert: { id?: string; title: string; body?: string | null; emoji?: string | null; created_by: string; pinned?: boolean; created_at?: string }
        Update: { pinned?: boolean }
        Relationships: []
      }
      reminders: {
        Row: { id: string; title: string; content: string | null; created_by: string; resolved: boolean; due_date: string | null; due_time: string | null; type: 'personal' | 'team' | null; created_at: string }
        Insert: { id?: string; title: string; content?: string | null; created_by: string; resolved?: boolean; due_date?: string | null; due_time?: string | null; type?: 'personal' | 'team'; created_at?: string }
        Update: { resolved?: boolean }
        Relationships: []
      }
      reminder_completions: {
        Row: { id: string; reminder_id: string; nickname: string; completed_at: string }
        Insert: { id?: string; reminder_id: string; nickname: string; completed_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      mood_submissions: {
        Row: { id: string; nickname: string; week_number: number; year: number; score: number; mood_key: string; note: string | null; public_name: boolean; submitted_at: string }
        Insert: { id?: string; nickname: string; week_number: number; year: number; score: number; mood_key: string; note?: string | null; public_name?: boolean; submitted_at?: string }
        Update: { score?: number; mood_key?: string; note?: string | null; public_name?: boolean }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
