-- Function to get total cards count for a user (sum of quantities)
-- Returns 0 if user has no cards
--
-- Usage: SELECT get_user_total_cards('user-uuid-here');
-- Or via Supabase RPC: supabase.rpc('get_user_total_cards', { p_user_id: userId })

CREATE OR REPLACE FUNCTION get_user_total_cards(p_user_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(COALESCE(quantity, 1)), 0)::integer
  FROM collection_cards
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_total_cards(uuid) TO authenticated;
