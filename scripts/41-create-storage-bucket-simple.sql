-- ============================================================================
-- Migration 41: Create Membership Documents Storage Bucket
-- ============================================================================
-- Description: Creates storage bucket for membership application documents
-- Note: RLS policies must be configured manually in Supabase Dashboard
-- ============================================================================

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'membership-documents',
  'membership-documents',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'membership-documents';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "membership-documents" created successfully!';
  RAISE NOTICE '⚠️  IMPORTANT: You must configure RLS policies manually in Supabase Dashboard';
  RAISE NOTICE '📖 See docs/STORAGE_BUCKET_SETUP.md for policy configuration';
END $$;
