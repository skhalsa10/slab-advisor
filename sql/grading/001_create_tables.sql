-- Collection Card Gradings Table
-- Stores grading results from Ximilar card-grader API
-- All operations happen server-side using service role
--
-- Applied to Supabase via MCP migration: create_collection_card_gradings_table

CREATE TABLE IF NOT EXISTS collection_card_gradings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_card_id UUID NOT NULL REFERENCES collection_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full API response for audit trail & Phase 2 annotations
  raw_response JSONB NOT NULL,

  -- Combined/Final grades (from top-level API response)
  -- These represent the overall grade considering both front and back
  grade_corners DECIMAL(3,1),
  grade_edges DECIMAL(3,1),
  grade_surface DECIMAL(3,1),
  grade_centering DECIMAL(3,1),
  grade_final DECIMAL(3,1),
  condition TEXT,

  -- Front-side summary
  front_grade_final DECIMAL(3,1),
  front_centering_lr TEXT,  -- e.g., "64/36"
  front_centering_tb TEXT,  -- e.g., "47/53"

  -- Back-side summary
  back_grade_final DECIMAL(3,1),
  back_centering_lr TEXT,
  back_centering_tb TEXT,

  -- Persisted annotated images (downloaded from Ximilar's temporary URLs)
  front_annotated_full_url TEXT,
  front_annotated_exact_url TEXT,
  back_annotated_full_url TEXT,
  back_annotated_exact_url TEXT
);

-- Add comment for documentation
COMMENT ON TABLE collection_card_gradings IS 'Stores card grading results from Ximilar API. One grading per collection card.';
COMMENT ON COLUMN collection_card_gradings.raw_response IS 'Full Ximilar API response for audit trail and future annotation rendering';
COMMENT ON COLUMN collection_card_gradings.grade_final IS 'Overall combined grade from both front and back analysis';
COMMENT ON COLUMN collection_card_gradings.front_centering_lr IS 'Front side left/right centering ratio, e.g., 64/36';
COMMENT ON COLUMN collection_card_gradings.front_centering_tb IS 'Front side top/bottom centering ratio, e.g., 47/53';
