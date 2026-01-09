-- Storage bucket for collection card images
-- PRIVATE bucket - images are accessed server-side and converted to base64 for Ximilar API
--
-- Path convention:
-- collection-card-images/{user_id}/{collection_card_id}/
-- ├── front_original.{ext}        → collection_cards.front_image_url
-- ├── back_original.{ext}         → collection_cards.back_image_url
-- ├── front_graded_full.webp      → collection_card_gradings.front_annotated_full_url
-- ├── front_graded_exact.webp     → collection_card_gradings.front_annotated_exact_url
-- ├── back_graded_full.webp       → collection_card_gradings.back_annotated_full_url
-- └── back_graded_exact.webp      → collection_card_gradings.back_annotated_exact_url
--
-- Applied to Supabase via MCP migration: create_collection_card_images_bucket

-- Create the collection-card-images bucket (PRIVATE - not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collection-card-images',
  'collection-card-images',
  false,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload to their own folder
-- Path must start with user's UUID
CREATE POLICY "Users can upload own collection card images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'collection-card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own collection card images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'collection-card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own images
CREATE POLICY "Users can update own collection card images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'collection-card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own collection card images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'collection-card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
