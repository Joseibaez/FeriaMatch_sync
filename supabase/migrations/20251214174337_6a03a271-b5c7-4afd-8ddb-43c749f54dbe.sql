-- Add description and image_url columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS image_url text;