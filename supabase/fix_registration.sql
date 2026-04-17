-- ================================================
-- FIX: Registration errors + missing columns
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Add ALL missing columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS can_donate BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_create_campaign BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'فلسطين',
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS total_donated NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaigns_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS donations_count INT DEFAULT 0;

-- Step 2: Add missing columns to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS donors_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Step 3: Fix the trigger - this is the main cause of registration errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_can_donate BOOLEAN;
  v_can_create BOOLEAN;
BEGIN
  -- Safely extract metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'donor');
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_can_donate := COALESCE((NEW.raw_user_meta_data->>'can_donate')::boolean, true);
  v_can_create := COALESCE(
    (NEW.raw_user_meta_data->>'can_create_campaign')::boolean,
    v_role IN ('organization', 'beneficiary', 'admin')
  );

  INSERT INTO public.profiles (
    id, email, full_name, role,
    can_donate, can_create_campaign,
    country, is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role,
    v_can_donate,
    v_can_create,
    'فلسطين',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix RLS policies - add missing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Storage policies for avatars bucket
-- Run these after creating the buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campaign-images', 'campaign-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
DROP POLICY IF EXISTS "Avatar images publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Campaign images publicly accessible" ON storage.objects;
CREATE POLICY "Campaign images publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-images');

DROP POLICY IF EXISTS "Auth users upload campaign images" ON storage.objects;
CREATE POLICY "Auth users upload campaign images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'campaign-images' AND auth.role() = 'authenticated'
  );

SELECT 'All fixes applied successfully! ✅' as result;
