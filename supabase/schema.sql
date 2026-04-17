-- ================================================
-- ATHAR PLATFORM - SUPABASE DATABASE SCHEMA
-- SAFE VERSION (NO DUPLICATE POLICY ERRORS)
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('admin', 'moderator', 'donor', 'organization', 'beneficiary')),
  bio TEXT,
  address TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CAMPAIGNS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  raised_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('health','education','food','shelter','emergency','orphans','water','other')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','active','completed')),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_beneficiary_campaign BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- DONATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  donor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD','USDT')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal','usdt','card')),
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- RLS ENABLE
-- ================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- ================================================
-- SAFE POLICIES (DROP FIRST THEN CREATE)
-- ================================================

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CAMPAIGNS
DROP POLICY IF EXISTS "Approved campaigns are viewable by everyone" ON campaigns;
CREATE POLICY "Approved campaigns are viewable by everyone"
ON campaigns FOR SELECT USING (
  status IN ('approved','active')
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','moderator')
  )
);

DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON campaigns;
CREATE POLICY "Authenticated users can create campaigns"
ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Campaign owners can update their campaigns" ON campaigns;
CREATE POLICY "Campaign owners can update their campaigns"
ON campaigns FOR UPDATE USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','moderator')
  )
);

DROP POLICY IF EXISTS "Admins can delete campaigns" ON campaigns;
CREATE POLICY "Admins can delete campaigns"
ON campaigns FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- DONATIONS
DROP POLICY IF EXISTS "Campaign owners can view their donations" ON donations;
CREATE POLICY "Campaign owners can view their donations"
ON donations FOR SELECT USING (
  donor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = campaign_id
    AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','moderator')
  )
);

DROP POLICY IF EXISTS "Authenticated users can create donations" ON donations;
CREATE POLICY "Authenticated users can create donations"
ON donations FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- ================================================
-- FUNCTIONS
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- update campaign raised amount
CREATE OR REPLACE FUNCTION update_campaign_raised()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE campaigns
    SET raised_amount = raised_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_donation_completed ON donations;

CREATE TRIGGER on_donation_completed
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION update_campaign_raised();

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- ADMIN SET (RUN AFTER USER CREATION)
-- ================================================
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL_HERE';