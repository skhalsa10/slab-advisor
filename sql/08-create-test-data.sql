-- ============================================================================
-- TEST DATA CREATION SCRIPT
-- Purpose: Create sample data for testing and development
-- Usage: Run to populate database with test data
-- WARNING: Only use in development! Not for production.
-- ============================================================================

-- Create test user credits (simulating 3 different users)
-- Note: These UUIDs are fake - in real usage, they come from Supabase Auth
INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 5, 10, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 2, 2, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 0, 5, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
    credits_remaining = EXCLUDED.credits_remaining,
    total_credits_purchased = EXCLUDED.total_credits_purchased,
    updated_at = NOW();

-- Create test cards for user 1 (with analysis results)
INSERT INTO cards (
    id, user_id, card_title, estimated_grade, confidence, 
    front_image_url, back_image_url, grading_details, created_at, updated_at
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '2023 Topps Chrome Mike Trout',
    8.5,
    0.92,
    'https://example.com/front1.jpg',
    'https://example.com/back1.jpg',
    '{"corners": 8.0, "edges": 8.5, "surface": 9.0, "centering": 8.5, "condition": "Near Mint"}',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    '10000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '1986 Fleer Michael Jordan Rookie',
    6.0,
    0.88,
    'https://example.com/front2.jpg',
    'https://example.com/back2.jpg',
    '{"corners": 5.5, "edges": 6.0, "surface": 6.5, "centering": 6.0, "condition": "Excellent"}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '2021 Panini Prizm Ja Morant',
    9.0,
    0.95,
    'https://example.com/front3.jpg',
    'https://example.com/back3.jpg',
    '{"corners": 9.0, "edges": 9.0, "surface": 9.0, "centering": 9.0, "condition": "Mint"}',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT (id) DO UPDATE SET
    card_title = EXCLUDED.card_title,
    estimated_grade = EXCLUDED.estimated_grade,
    confidence = EXCLUDED.confidence,
    updated_at = NOW();

-- Create test cards for user 2 (pending analysis)
INSERT INTO cards (
    id, user_id, card_title, front_image_url, back_image_url, created_at, updated_at
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    '2022 Topps Update Vladimir Guerrero Jr.',
    'https://example.com/front4.jpg',
    'https://example.com/back4.jpg',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO UPDATE SET
    card_title = EXCLUDED.card_title,
    updated_at = NOW();

-- Create test cards for user 3 (mixed results)
INSERT INTO cards (
    id, user_id, card_title, estimated_grade, confidence, 
    front_image_url, back_image_url, grading_details, created_at, updated_at
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    '1993 SP Derek Jeter Rookie',
    7.5,
    0.89,
    'https://example.com/front5.jpg',
    'https://example.com/back5.jpg',
    '{"corners": 7.0, "edges": 8.0, "surface": 8.0, "centering": 7.0, "condition": "Near Mint"}',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
),
(
    '30000000-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    '2020 Bowman Chrome Jasson Dominguez',
    4.5,
    0.78,
    'https://example.com/front6.jpg',
    'https://example.com/back6.jpg',
    '{"corners": 4.0, "edges": 5.0, "surface": 4.5, "centering": 4.5, "condition": "Very Good"}',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO UPDATE SET
    card_title = EXCLUDED.card_title,
    estimated_grade = EXCLUDED.estimated_grade,
    confidence = EXCLUDED.confidence,
    updated_at = NOW();

-- Show what was created
SELECT 'TEST_DATA_SUMMARY' as summary_type, 'Users created' as description, COUNT(*) as count FROM user_credits
UNION ALL
SELECT 'TEST_DATA_SUMMARY', 'Cards created', COUNT(*) FROM cards
UNION ALL
SELECT 'TEST_DATA_SUMMARY', 'Cards with grades', COUNT(*) FROM cards WHERE estimated_grade IS NOT NULL
UNION ALL
SELECT 'TEST_DATA_SUMMARY', 'Cards pending analysis', COUNT(*) FROM cards WHERE estimated_grade IS NULL;

-- Show test users and their data
SELECT 
    'USER_SUMMARY' as summary_type,
    uc.user_id,
    uc.credits_remaining,
    COUNT(c.id) as total_cards,
    COUNT(CASE WHEN c.estimated_grade IS NOT NULL THEN 1 END) as analyzed_cards
FROM user_credits uc
LEFT JOIN cards c ON uc.user_id = c.user_id
GROUP BY uc.user_id, uc.credits_remaining
ORDER BY uc.user_id;

SELECT 'TEST_DATA_COMPLETE' as status, 'Test data created successfully' as message;