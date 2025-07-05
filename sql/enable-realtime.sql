-- ============================================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- Purpose: Enable realtime updates for the user_credits table
-- Usage: Run in Supabase SQL Editor
-- ============================================================================

-- Enable realtime for the user_credits table
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;

-- Verify realtime is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- Show result
SELECT 'REALTIME_ENABLED' as status, 'Realtime subscriptions are now active for user_credits table' as message;