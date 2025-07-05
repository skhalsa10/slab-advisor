-- ============================================================================
-- STORAGE POLICIES SCRIPT
-- Purpose: Set up secure storage policies for card-images bucket
-- Usage: Run after creating the bucket
-- ============================================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own card images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view card images" ON storage.objects;

-- Policy 1: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload card images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'card-images' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    (metadata->>'size')::bigint <= 10485760 AND
    (metadata->>'mimetype' IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'))
);

-- Policy 2: Public can view all card images (needed for Ximilar API)
CREATE POLICY "Public can view card images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'card-images'
);

-- Policy 3: Users can delete their own images
CREATE POLICY "Users can delete own card images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'card-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can update their own images (for metadata)
CREATE POLICY "Users can update own card images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'card-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify policies using pg_policies
SELECT 
    'POLICY_CHECK' as status,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN policyname = 'Public can view card images' THEN 'Allows Ximilar to access images'
        WHEN policyname = 'Users can upload card images' THEN 'Secure upload - user folder only'
        WHEN policyname = 'Users can delete own card images' THEN 'Users control their own images'
        ELSE 'Security policy'
    END as purpose
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%card%'
ORDER BY cmd;

SELECT 'POLICIES_CREATED' as status, 'Storage is now public read-only with secure upload' as message;