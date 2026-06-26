-- Migration: mood_entries + daily_words tables for the Moood page
-- These replace the weekly mood_submissions pattern with per-day entries.

-- ─── mood_entries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname     citext NOT NULL REFERENCES users(nickname) ON DELETE CASCADE,
  entry_date   date NOT NULL,
  score        int  NOT NULL CHECK (score BETWEEN 1 AND 5),
  mood_key     text NOT NULL CHECK (mood_key IN ('great','good','okay','meh','rough')),
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (nickname, entry_date)
);

CREATE INDEX IF NOT EXISTS mood_entries_entry_date_idx ON mood_entries (entry_date);
CREATE INDEX IF NOT EXISTS mood_entries_nickname_idx   ON mood_entries (nickname);

-- ─── daily_words ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_words (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname     citext NOT NULL REFERENCES users(nickname) ON DELETE CASCADE,
  word         text NOT NULL CHECK (char_length(word) BETWEEN 1 AND 20),
  entry_date   date NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (nickname, entry_date)
);

CREATE INDEX IF NOT EXISTS daily_words_entry_date_idx ON daily_words (entry_date);
CREATE INDEX IF NOT EXISTS daily_words_nickname_idx   ON daily_words (nickname);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- SELECT is open to anon (team can see all entries for pulse display).
-- INSERT/UPDATE/DELETE are denied at the DB level — all mutations go through
-- Next.js Server Actions that use the service role key and enforce their own
-- nickname-matching + date-guard validation.

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_entries_select_open"
  ON mood_entries FOR SELECT
  USING (true);

CREATE POLICY "mood_entries_no_direct_write"
  ON mood_entries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "mood_entries_no_direct_update"
  ON mood_entries FOR UPDATE
  USING (false);

CREATE POLICY "mood_entries_no_direct_delete"
  ON mood_entries FOR DELETE
  USING (false);

ALTER TABLE daily_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_words_select_open"
  ON daily_words FOR SELECT
  USING (true);

CREATE POLICY "daily_words_no_direct_write"
  ON daily_words FOR INSERT
  WITH CHECK (false);

CREATE POLICY "daily_words_no_direct_update"
  ON daily_words FOR UPDATE
  USING (false);

CREATE POLICY "daily_words_no_direct_delete"
  ON daily_words FOR DELETE
  USING (false);
