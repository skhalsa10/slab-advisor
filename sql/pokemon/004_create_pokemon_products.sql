-- Create Pokemon Products Table for Sealed Products
-- This table stores sealed products (booster boxes, ETBs, bundles, etc.) from TCGPlayer
-- Products are linked to sets via tcgplayer_group_id and pokemon_set_id

-- Create the products table
CREATE TABLE IF NOT EXISTS pokemon_products (
  id SERIAL PRIMARY KEY,
  tcgplayer_product_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tcgplayer_image_url TEXT,
  tcgplayer_group_id INTEGER NOT NULL,
  pokemon_set_id TEXT REFERENCES pokemon_sets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pokemon_products_tcgplayer_group_id 
ON pokemon_products(tcgplayer_group_id);

CREATE INDEX IF NOT EXISTS idx_pokemon_products_pokemon_set_id 
ON pokemon_products(pokemon_set_id);

CREATE INDEX IF NOT EXISTS idx_pokemon_products_name 
ON pokemon_products USING gin(to_tsvector('english', name));

-- Enable Row Level Security
ALTER TABLE pokemon_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read-only public access

-- Allow everyone to read products
CREATE POLICY "Pokemon products are viewable by everyone" 
ON pokemon_products 
FOR SELECT 
USING (true);

-- No INSERT, UPDATE, or DELETE policies means only service role can modify

-- Add table and column comments for documentation
COMMENT ON TABLE pokemon_products IS 'Sealed Pokemon products (booster boxes, ETBs, bundles, cases, etc.) from TCGPlayer - excludes individual cards';

COMMENT ON COLUMN pokemon_products.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN pokemon_products.tcgplayer_product_id IS 'TCGPlayer unique product identifier';
COMMENT ON COLUMN pokemon_products.name IS 'Product name from TCGPlayer';
COMMENT ON COLUMN pokemon_products.tcgplayer_image_url IS 'Product image URL from TCGPlayer CDN';
COMMENT ON COLUMN pokemon_products.tcgplayer_group_id IS 'TCGPlayer group ID that links to pokemon_sets.tcgplayer_group_id';
COMMENT ON COLUMN pokemon_products.pokemon_set_id IS 'Foreign key to pokemon_sets.id for direct relationship';

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pokemon_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pokemon_products_updated_at_trigger
BEFORE UPDATE ON pokemon_products
FOR EACH ROW
EXECUTE FUNCTION update_pokemon_products_updated_at();