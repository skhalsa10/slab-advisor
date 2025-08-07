-- Pokemon Audit Queries
-- Useful queries for debugging and inspecting Pokemon TCG data

-- =====================================================
-- 1. Get list of all Pokemon series
-- Returns: id and name of each series
-- =====================================================
SELECT 
    id,
    name,
    logo,
    created_at,
    updated_at
FROM pokemon_series
ORDER BY name;

-- =====================================================
-- 2. Get list of all sets in a given series
-- Replace 'SERIES_ID' with actual series id
-- Returns: set ids and names for a specific series
-- =====================================================
SELECT 
    ps.id as set_id,
    ps.name as set_name,
    ps.symbol,
    ps.card_count_total,
    ps.release_date,
    ser.name as series_name
FROM pokemon_sets ps
JOIN pokemon_series ser ON ps.series_id = ser.id
WHERE ps.series_id = 'SERIES_ID'  -- Replace with actual series ID
ORDER BY ps.release_date DESC, ps.name;

-- Example with Base Set series:
-- WHERE ps.series_id = 'base'

-- =====================================================
-- 3. Get list of all cards in a set
-- Replace 'SET_ID' with actual set id
-- Returns: id and name of each card in the set
-- =====================================================
SELECT 
    pc.id as card_id,
    pc.local_id,
    pc.name,
    pc.category,
    pc.rarity,
    pc.illustrator,
    ps.name as set_name
FROM pokemon_cards pc
JOIN pokemon_sets ps ON pc.set_id = ps.id
WHERE pc.set_id = 'SET_ID'  -- Replace with actual set ID
ORDER BY 
    CASE 
        WHEN pc.local_id ~ '^[0-9]+$' THEN LPAD(pc.local_id, 10, '0')
        ELSE pc.local_id
    END;

-- Example with Base Set:
-- WHERE pc.set_id = 'base1'

-- =====================================================
-- 4. Get all data for a given card ID
-- Replace 'CARD_ID' with actual card id
-- Returns: All card details including set and series info
-- =====================================================
SELECT 
    -- Card details
    pc.id,
    pc.name,
    pc.local_id,
    pc.category,
    pc.rarity,
    pc.illustrator,
    pc.image,
    pc.variant_normal,
    pc.variant_holo,
    pc.variant_reverse,
    pc.variant_first_edition,
    pc.tcgplayer_product_id,
    pc.tcgplayer_image_url,
    pc.created_at as card_created_at,
    pc.updated_at as card_updated_at,
    -- Set details
    ps.id as set_id,
    ps.name as set_name,
    ps.symbol as set_symbol,
    ps.logo as set_logo,
    ps.release_date as set_release_date,
    ps.card_count_total as set_total_cards,
    ps.card_count_official as set_official_cards,
    ps.card_count_holo as set_holo_cards,
    ps.card_count_reverse as set_reverse_cards,
    ps.card_count_first_ed as set_first_ed_cards,
    ps.tcgplayer_group_id as set_tcgplayer_group_id,
    ps.tcgplayer_url as set_tcgplayer_url,
    -- Series details
    ser.id as series_id,
    ser.name as series_name,
    ser.logo as series_logo
FROM pokemon_cards pc
JOIN pokemon_sets ps ON pc.set_id = ps.id
JOIN pokemon_series ser ON ps.series_id = ser.id
WHERE pc.id = 'CARD_ID';  -- Replace with actual card ID

-- Example with Charizard from Base Set:
-- WHERE pc.id = 'base1-4'

-- =====================================================
-- 5. Get complete information for a specific set
-- Replace 'SET_ID' with actual set id
-- Returns: All set details including card counts and TCGPlayer data
-- =====================================================
SELECT 
    ps.id as set_id,
    ps.name as set_name,
    ps.series_id,
    ser.name as series_name,
    ps.logo,
    ps.symbol,
    ps.release_date,
    ps.card_count_total,
    ps.card_count_official,
    ps.card_count_holo,
    ps.card_count_reverse,
    ps.card_count_first_ed,
    ps.tcgplayer_group_id,
    ps.tcgplayer_url,
    ps.created_at,
    ps.updated_at
FROM pokemon_sets ps
LEFT JOIN pokemon_series ser ON ps.series_id = ser.id
WHERE ps.id = 'SET_ID';  -- Replace with actual set ID

-- Example with Scarlet & Violet base set:
-- WHERE ps.id = 'sv1'

-- =====================================================
-- 6. Get all products for a specific set
-- Replace 'SET_ID' with actual set id
-- Returns: All sealed products for a set
-- =====================================================
SELECT 
    pp.id,
    pp.name,
    pp.tcgplayer_product_id,
    pp.tcgplayer_image_url,
    pp.tcgplayer_group_id,
    pp.created_at,
    pp.updated_at,
    ps.name as set_name,
    ps.id as set_id
FROM pokemon_products pp
JOIN pokemon_sets ps ON pp.pokemon_set_id = ps.id
WHERE pp.pokemon_set_id = 'SET_ID'  -- Replace with actual set ID
ORDER BY pp.name;

-- Example with Destined Rivals:
-- WHERE pp.pokemon_set_id = 'sv10'

-- =====================================================
-- BONUS: Useful aggregate queries
-- =====================================================

-- Count cards by rarity in a set
SELECT 
    ps.name as set_name,
    pc.rarity,
    COUNT(*) as card_count
FROM pokemon_cards pc
JOIN pokemon_sets ps ON pc.set_id = ps.id
WHERE pc.set_id = 'SET_ID'  -- Replace with actual set ID
GROUP BY ps.name, pc.rarity
ORDER BY card_count DESC;

-- Count total cards per series
SELECT 
    ser.name as series_name,
    COUNT(DISTINCT ps.id) as total_sets,
    SUM(ps.card_count_total) as total_cards_in_series
FROM pokemon_series ser
LEFT JOIN pokemon_sets ps ON ser.id = ps.series_id
GROUP BY ser.id, ser.name
ORDER BY total_cards_in_series DESC;

-- Find cards with specific variants
SELECT 
    pc.id,
    pc.name,
    ps.name as set_name,
    pc.variant_holo,
    pc.variant_reverse,
    pc.variant_first_edition
FROM pokemon_cards pc
JOIN pokemon_sets ps ON pc.set_id = ps.id
WHERE pc.variant_holo = true 
   OR pc.variant_reverse = true 
   OR pc.variant_first_edition = true
ORDER BY ps.release_date DESC, pc.name;

-- Search cards by name (case insensitive)
SELECT 
    pc.id,
    pc.name,
    ps.name as set_name,
    ser.name as series_name,
    pc.rarity
FROM pokemon_cards pc
JOIN pokemon_sets ps ON pc.set_id = ps.id
JOIN pokemon_series ser ON ps.series_id = ser.id
WHERE LOWER(pc.name) LIKE LOWER('%SEARCH_TERM%')  -- Replace SEARCH_TERM
ORDER BY ps.release_date DESC, pc.name;

-- Example searching for Pikachu:
-- WHERE LOWER(pc.name) LIKE LOWER('%pikachu%')