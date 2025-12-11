-- Create storage buckets for files

-- Public bucket for avatars and company logos (publicly readable)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-files', 
  'public-files', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for CVs and secure documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'secure-documents', 
  'secure-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLICIES FOR PUBLIC-FILES BUCKET (avatars, logos)
-- =====================================================

-- Anyone can view public files
CREATE POLICY "Public files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-files');

-- Authenticated users can upload their own files
CREATE POLICY "Users can upload their own public files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update their own public files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own public files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES FOR SECURE-DOCUMENTS BUCKET (CVs)
-- =====================================================

-- Users can view their own documents
CREATE POLICY "Users can view their own secure documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'secure-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all secure documents
CREATE POLICY "Admins can view all secure documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'secure-documents' 
  AND public.get_user_role(auth.uid()) = 'admin'::public.user_role
);

-- Recruiters can view CVs of candidates who booked with their company
CREATE POLICY "Recruiters can view booked candidate CVs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'secure-documents'
  AND public.get_user_role(auth.uid()) = 'recruiter'::public.user_role
  AND EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.slot_allocations sa ON sa.id = b.slot_allocation_id
    WHERE b.user_id::text = (storage.foldername(name))[1]
      AND sa.company_name = public.get_user_company_name(auth.uid())
  )
);

-- Users can upload their own secure documents
CREATE POLICY "Users can upload their own secure documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'secure-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own secure documents
CREATE POLICY "Users can update their own secure documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'secure-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own secure documents
CREATE POLICY "Users can delete their own secure documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'secure-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- ADD logo_url COLUMN TO PROFILES (if not exists)
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;