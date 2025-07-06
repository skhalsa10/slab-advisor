-- Add card identification fields to the cards table
-- These fields will store data from the Ximilar analyze API

-- Add individual identification fields
ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_set TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS rarity TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS out_of TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_number TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_series_code TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_code TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS links JSONB;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS analyze_details JSONB;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_cards_card_set ON cards(card_set);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_year ON cards(year);
CREATE INDEX IF NOT EXISTS idx_cards_subcategory ON cards(subcategory);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON cards(card_number);

-- Add a composite index for set + card number (common search pattern)
CREATE INDEX IF NOT EXISTS idx_cards_set_number ON cards(card_set, card_number);

-- Update RLS policies if needed (inherit existing policies)
-- The existing RLS policies should already cover these new fields