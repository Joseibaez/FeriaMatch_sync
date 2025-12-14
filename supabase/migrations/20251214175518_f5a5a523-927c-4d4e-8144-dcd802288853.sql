-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true);

-- Create policy for public read access
CREATE POLICY "Anyone can view event banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-banners');

-- Create policy for admin upload
CREATE POLICY "Admins can upload event banners"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-banners' AND get_user_role(auth.uid()) = 'admin'::user_role);

-- Create policy for admin update
CREATE POLICY "Admins can update event banners"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-banners' AND get_user_role(auth.uid()) = 'admin'::user_role);

-- Create policy for admin delete
CREATE POLICY "Admins can delete event banners"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-banners' AND get_user_role(auth.uid()) = 'admin'::user_role);