-- Add preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;