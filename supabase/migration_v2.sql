-- ================================================
-- ATHAR — MIGRATION v2
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add new profile columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'فلسطين',
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS can_donate BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_create_campaign BOOLEAN DEFAULT false;

-- 2. Give org/beneficiary/admin campaign creation rights
UPDATE profiles
SET can_create_campaign = true
WHERE role IN ('organization','beneficiary','admin','moderator');

UPDATE profiles SET can_donate = true WHERE can_donate IS NULL;

-- ================================================
-- SEED: Two real-context Palestinian campaigns
-- ================================================

DO $$
DECLARE
  owner_uuid UUID;
BEGIN
  SELECT id INTO owner_uuid FROM profiles LIMIT 1;

  IF owner_uuid IS NULL THEN
    RAISE NOTICE 'No users found. Register an account first.';
    RETURN;
  END IF;

  DELETE FROM campaigns WHERE title IN (
    'علاج جرحى غزة — عمليات طارئة لمئة مصاب',
    'إعادة بناء مدرسة في خان يونس'
  );

  INSERT INTO campaigns (
    id, title, description, images,
    target_amount, raised_amount,
    category, status, owner_id,
    is_beneficiary_campaign, end_date
  ) VALUES (
    gen_random_uuid(),
    'علاج جرحى غزة — عمليات طارئة لمئة مصاب',
    'قطاع غزة يعيش كارثة إنسانية غير مسبوقة. المستشفيات ممتلئة بجرحى يحتاجون لعمليات جراحية عاجلة ولا توجد إمكانيات كافية.

هدف الحملة:
• إجراء ١٠٠ عملية جراحية طارئة للمصابين
• توفير الأدوية والمواد الطبية اللازمة
• دعم الكوادر الطبية الميدانية العاملة تحت القصف

كل تبرع ينقذ حياة.',
    ARRAY['https://picsum.photos/seed/gaza-medical/800/600'],
    150000, 87340,
    'emergency', 'approved', owner_uuid, false,
    (NOW() + INTERVAL '45 days')::DATE
  );

  INSERT INTO campaigns (
    id, title, description, images,
    target_amount, raised_amount,
    category, status, owner_id,
    is_beneficiary_campaign, end_date
  ) VALUES (
    gen_random_uuid(),
    'إعادة بناء مدرسة في خان يونس',
    'مدرسة الأمل في خان يونس تضررت بشكل كبير. أكثر من ٨٠٠ طالب وطالبة محرومون من التعليم.

ماذا سنبني؟
• ١٢ غرفة صفية مجهزة بالكامل
• مختبر حاسوب
• مكتبة مدرسية
• ملعب وساحة داخلية

التعليم حق لا يُسرق.',
    ARRAY['https://picsum.photos/seed/khan-yunis-school/800/600'],
    80000, 31500,
    'education', 'approved', owner_uuid, false,
    (NOW() + INTERVAL '90 days')::DATE
  );

  RAISE NOTICE 'Campaigns inserted for user: %', owner_uuid;
END $$;

-- Update trigger to default country = Palestine
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role,
    country, can_donate, can_create_campaign
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor'),
    'فلسطين',
    true,
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role','donor') IN ('organization','beneficiary','admin')
      THEN true ELSE false
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT id, title, status, raised_amount, target_amount FROM campaigns ORDER BY created_at DESC LIMIT 5;
