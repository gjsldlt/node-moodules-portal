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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
