-- Indexes for collection_card_gradings table
--
-- Applied to Supabase via MCP migration: create_collection_card_gradings_indexes

-- Primary lookup: find gradings for a specific collection card
CREATE INDEX idx_collection_card_gradings_collection_card_id
  ON collection_card_gradings(collection_card_id);

-- User-based queries (for RLS and user dashboard)
CREATE INDEX idx_collection_card_gradings_user_id
  ON collection_card_gradings(user_id);

-- Filter by final grade (e.g., "show all cards graded 9 or higher")
CREATE INDEX idx_collection_card_gradings_grade_final
  ON collection_card_gradings(grade_final);

-- Sort by most recent gradings
CREATE INDEX idx_collection_card_gradings_created_at
  ON collection_card_gradings(created_at DESC);
