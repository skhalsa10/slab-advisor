-- Add TCGPlayer card-level integration fields for Pokemon cards
-- This provides product IDs and image URLs from TCGPlayer as backup/alternative sources

-- Add tcgplayer_product_id to store TCGPlayer's unique product identifier
ALTER TABLE pokemon_cards 
ADD COLUMN IF NOT EXISTS tcgplayer_product_id INTEGER;

-- Add tcgplayer_image_url to store TCGPlayer's image URL
ALTER TABLE pokemon_cards 
ADD COLUMN IF NOT EXISTS tcgplayer_image_url TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_tcgplayer_product_id 
ON pokemon_cards(tcgplayer_product_id) 
WHERE tcgplayer_product_id IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN pokemon_cards.tcgplayer_product_id IS 'TCGPlayer product ID - can construct URL as https://www.tcgplayer.com/product/{id}';
COMMENT ON COLUMN pokemon_cards.tcgplayer_image_url IS 'TCGPlayer image URL as backup/alternative to TCGdex images';