-- Row Level Security for collection_card_gradings table
--
-- NOTE: All grading operations happen server-side using service role (which bypasses RLS).
-- These policies serve as defense-in-depth - protecting data if client-side access
-- is ever misconfigured accidentally.
--
-- Applied to Supabase via MCP migration: create_collection_card_gradings_rls

ALTER TABLE collection_card_gradings ENABLE ROW LEVEL SECURITY;

-- Users can view their own gradings
CREATE POLICY "Users can view own gradings"
  ON collection_card_gradings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own gradings
CREATE POLICY "Users can insert own gradings"
  ON collection_card_gradings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gradings
CREATE POLICY "Users can update own gradings"
  ON collection_card_gradings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own gradings
CREATE POLICY "Users can delete own gradings"
  ON collection_card_gradings FOR DELETE
  USING (auth.uid() = user_id);
