-- Row Level Security for collection_cards table

-- Enable RLS
ALTER TABLE collection_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own collection cards" ON collection_cards;
DROP POLICY IF EXISTS "Users can insert their own collection cards" ON collection_cards;
DROP POLICY IF EXISTS "Users can update their own collection cards" ON collection_cards;
DROP POLICY IF EXISTS "Users can delete their own collection cards" ON collection_cards;

-- Policy: Users can only view their own collection cards
CREATE POLICY "Users can view their own collection cards" 
  ON collection_cards 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can only insert cards to their own collection
CREATE POLICY "Users can insert their own collection cards" 
  ON collection_cards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own collection cards
CREATE POLICY "Users can update their own collection cards" 
  ON collection_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own collection cards
CREATE POLICY "Users can delete their own collection cards" 
  ON collection_cards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON collection_cards TO authenticated;
GRANT ALL ON collection_cards TO service_role;