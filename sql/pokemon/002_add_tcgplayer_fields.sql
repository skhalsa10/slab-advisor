-- Add TCGPlayer integration fields to pokemon_sets table
-- This migration adds support for linking sets to TCGPlayer for shopping and pricing

-- Add tcgplayer_group_id to store the TCGPlayer group identifier
ALTER TABLE pokemon_sets 
ADD COLUMN IF NOT EXISTS tcgplayer_group_id INTEGER;

-- Add tcgplayer_url to store the generated TCGPlayer URL for the set
ALTER TABLE pokemon_sets 
ADD COLUMN IF NOT EXISTS tcgplayer_url TEXT;

-- Create an index on tcgplayer_group_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_pokemon_sets_tcgplayer_group_id 
ON pokemon_sets(tcgplayer_group_id) 
WHERE tcgplayer_group_id IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN pokemon_sets.tcgplayer_group_id IS 'TCGPlayer group ID for linking to TCGPlayer API and marketplace';
COMMENT ON COLUMN pokemon_sets.tcgplayer_url IS 'Generated TCGPlayer URL for shopping/affiliate links';