-- Indexes for collection_cards table

-- User queries (most common)
CREATE INDEX idx_collection_cards_user_id 
  ON collection_cards(user_id);

-- Card reference queries
CREATE INDEX idx_collection_cards_pokemon_card_id 
  ON collection_cards(pokemon_card_id) 
  WHERE pokemon_card_id IS NOT NULL;

-- Variant filtering
CREATE INDEX idx_collection_cards_variant 
  ON collection_cards(variant);

-- Card type filtering (for future multi-TCG support)
CREATE INDEX idx_collection_cards_card_type 
  ON collection_cards(card_type);

-- Composite index for unique constraint performance
CREATE INDEX idx_collection_cards_user_pokemon_variant 
  ON collection_cards(user_id, pokemon_card_id, variant) 
  WHERE pokemon_card_id IS NOT NULL;

-- Condition filtering
CREATE INDEX idx_collection_cards_condition 
  ON collection_cards(condition) 
  WHERE condition IS NOT NULL;

-- Grade filtering
CREATE INDEX idx_collection_cards_estimated_grade 
  ON collection_cards(estimated_grade) 
  WHERE estimated_grade IS NOT NULL;

-- Manual card name search
CREATE INDEX idx_collection_cards_manual_card_name 
  ON collection_cards(lower(manual_card_name)) 
  WHERE manual_card_name IS NOT NULL;