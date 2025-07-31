-- Collection Cards Table
-- User's personal collection with references to pokemon_cards
CREATE TABLE collection_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Card Reference
  card_type TEXT DEFAULT 'pokemon' CHECK (card_type IN ('pokemon', 'onepiece', 'sports', 'other_tcg')),
  pokemon_card_id TEXT REFERENCES pokemon_cards(id) ON DELETE SET NULL,
  variant TEXT NOT NULL CHECK (variant IN ('normal', 'holo', 'reverse_holo', 'first_edition', 'illustration_rare', 'alt_art', 'full_art', 'secret_rare', 'other')),
  
  -- Collection Data
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  condition TEXT CHECK (condition IN ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')),
  acquisition_date DATE,
  acquisition_price DECIMAL(10,2) CHECK (acquisition_price >= 0),
  notes TEXT,
  
  -- User Uploaded Images
  front_image_url TEXT,
  back_image_url TEXT,
  
  -- Grading Analysis
  estimated_grade INTEGER CHECK (estimated_grade >= 1 AND estimated_grade <= 10),
  grading_data JSONB, -- Full Ximilar API response
  
  -- Manual Card Data (when pokemon_card_id is NULL)
  manual_card_name TEXT,
  manual_set_name TEXT,
  manual_series TEXT,
  manual_rarity TEXT,
  manual_card_number TEXT,
  manual_year INTEGER CHECK (manual_year >= 1996 AND manual_year <= 2100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_card_variant UNIQUE(user_id, pokemon_card_id, variant),
  CONSTRAINT require_card_identification CHECK (
    pokemon_card_id IS NOT NULL OR manual_card_name IS NOT NULL
  )
);

-- Drop old cards table if exists
DROP TABLE IF EXISTS cards CASCADE;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_collection_cards_updated_at 
  BEFORE UPDATE ON collection_cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();