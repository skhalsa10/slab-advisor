-- ============================================================================
-- CREATE STORAGE BUCKET SCRIPT
-- Purpose: Create the card-images bucket and make it public
-- Usage: Run in Supabase SQL Editor
-- ============================================================================

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images', 
  'card-images', 
  true,  -- Make it public so Ximilar can access images
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Verify bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'card-images';

-- Check if any RLS policies exist on storage.objects for this bucket
SELECT 
  'STORAGE_RLS_POLICIES' as info_type,
  policyname as policy_name,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%card%';

SELECT 'BUCKET_CREATED' as status, 'Storage bucket card-images is now public' as message;