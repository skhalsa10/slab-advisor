-- Remove unused manual_* columns from collection_cards
-- These columns were for manual card entry but no UI was ever built to use them
-- Applied to: gamma (2026-02-06), production (2026-02-06)

-- Drop the index first (depends on the column)
DROP INDEX IF EXISTS idx_collection_cards_manual_card_name;

-- Drop columns
ALTER TABLE collection_cards
  DROP COLUMN IF EXISTS manual_card_name,
  DROP COLUMN IF EXISTS manual_set_name,
  DROP COLUMN IF EXISTS manual_card_number,
  DROP COLUMN IF EXISTS manual_rarity,
  DROP COLUMN IF EXISTS manual_series,
  DROP COLUMN IF EXISTS manual_year;
