-- Performance indexes for pokemon_series
CREATE INDEX idx_pokemon_series_name ON pokemon_series(name);
CREATE INDEX idx_pokemon_series_name_search ON pokemon_series USING gin(to_tsvector('english', name));

-- Performance indexes for pokemon_sets  
CREATE INDEX idx_pokemon_sets_series_id ON pokemon_sets(series_id);
CREATE INDEX idx_pokemon_sets_name ON pokemon_sets(name);
CREATE INDEX idx_pokemon_sets_name_search ON pokemon_sets USING gin(to_tsvector('english', name));
CREATE INDEX idx_pokemon_sets_release_date ON pokemon_sets(release_date DESC);
CREATE INDEX idx_pokemon_sets_card_count ON pokemon_sets(card_count_total DESC);

-- Performance indexes for pokemon_cards
CREATE INDEX idx_pokemon_cards_set_id ON pokemon_cards(set_id);
CREATE INDEX idx_pokemon_cards_name ON pokemon_cards(name);
CREATE INDEX idx_pokemon_cards_name_search ON pokemon_cards USING gin(to_tsvector('english', name));
CREATE INDEX idx_pokemon_cards_local_id ON pokemon_cards(local_id);
CREATE INDEX idx_pokemon_cards_category ON pokemon_cards(category);
CREATE INDEX idx_pokemon_cards_rarity ON pokemon_cards(rarity);
CREATE INDEX idx_pokemon_cards_variants ON pokemon_cards(variant_normal, variant_reverse, variant_holo, variant_first_edition);

-- Composite indexes for common queries
CREATE INDEX idx_pokemon_cards_set_local ON pokemon_cards(set_id, local_id);
CREATE INDEX idx_pokemon_cards_category_rarity ON pokemon_cards(category, rarity);