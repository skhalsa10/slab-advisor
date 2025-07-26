-- Pokemon Series Table
-- Maps to TCGDx Series Object
CREATE TABLE pokemon_series (
  id TEXT PRIMARY KEY,                    -- Serie Unique ID
  name TEXT NOT NULL,                     -- Serie Name  
  logo TEXT,                             -- Serie logo (nullable)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pokemon Sets Table  
-- Maps to TCGDx Set Object (simplified)
CREATE TABLE pokemon_sets (
  id TEXT PRIMARY KEY,                    -- Set Unique ID
  series_id TEXT REFERENCES pokemon_series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- Set Name
  logo TEXT,                             -- Set logo (nullable)
  symbol TEXT,                           -- Set Symbol (nullable)
  
  -- Card Count Object fields
  card_count_total INTEGER DEFAULT 0,     -- cardCount.total
  card_count_official INTEGER DEFAULT 0,  -- cardCount.official  
  card_count_reverse INTEGER DEFAULT 0,   -- cardCount.reverse
  card_count_holo INTEGER DEFAULT 0,      -- cardCount.holo
  card_count_first_ed INTEGER DEFAULT 0,  -- cardCount.firstEd
  
  -- Set metadata
  release_date DATE,                      -- releaseDate (yyyy-mm-dd)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pokemon Cards Table
-- Maps to TCGDx Card Object (simplified)
CREATE TABLE pokemon_cards (
  id TEXT PRIMARY KEY,                    -- The unique ID of the card
  set_id TEXT REFERENCES pokemon_sets(id) ON DELETE CASCADE,
  local_id TEXT,                         -- Card Local ID (can be string or number)
  name TEXT NOT NULL,                     -- Card Name
  image TEXT,                            -- Card Image (nullable)
  category TEXT,                         -- Card category (Pokemon, Energy, Trainer)
  illustrator TEXT,                      -- Card illustrator (nullable)
  rarity TEXT,                           -- Card rarity (nullable)
  
  -- Variants Object fields
  variant_normal BOOLEAN DEFAULT false,   -- variants.normal
  variant_reverse BOOLEAN DEFAULT false,  -- variants.reverse
  variant_holo BOOLEAN DEFAULT false,     -- variants.holo
  variant_first_edition BOOLEAN DEFAULT false, -- variants.firstEdition
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);