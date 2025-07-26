-- Enable Row Level Security
ALTER TABLE pokemon_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_sets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE pokemon_cards ENABLE ROW LEVEL SECURITY;

-- Public read access policies (ANYONE can read, including unauthenticated users)
CREATE POLICY "Anyone can read pokemon_series" 
  ON pokemon_series FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can read pokemon_sets"
  ON pokemon_sets FOR SELECT  
  USING (true);

CREATE POLICY "Anyone can read pokemon_cards"
  ON pokemon_cards FOR SELECT
  USING (true);

-- Admin-only write access (INSERT, UPDATE, DELETE)
-- Only authenticated users with admin role can modify data
CREATE POLICY "Admin only write pokemon_series"
  ON pokemon_series FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only write pokemon_sets" 
  ON pokemon_sets FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only write pokemon_cards"
  ON pokemon_cards FOR ALL  
  USING (auth.jwt() ->> 'role' = 'admin');

-- Alternative: Allow service_role for sync operations
CREATE POLICY "Service role write pokemon_series"
  ON pokemon_series FOR ALL
  USING (auth.role() = 'service_role');