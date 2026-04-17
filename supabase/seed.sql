-- ================================================
-- ATHAR PLATFORM — SEED DATA
-- Run AFTER schema.sql AND after creating real users
-- ================================================

DO $$
DECLARE
  owner_uuid UUID;
BEGIN
  SELECT id INTO owner_uuid FROM profiles LIMIT 1;

  IF owner_uuid IS NULL THEN
    RAISE NOTICE 'No profiles found. Create a user account first.';
    RETURN;
  END IF;

  -- Campaign 1: Health
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'علاج طفلة تعاني من مرض نادر',
    'ريم طفلة في الخامسة من عمرها تعاني من مرض نادر في القلب يحتاج لعملية جراحية عاجلة. عائلتها لا تستطيع تحمل تكاليف العملية البالغة 50,000 دولار. نحتاج مساعدتكم لإنقاذ حياة هذه الطفلة البريئة وإعادة الابتسامة لعائلتها.',
    ARRAY['https://picsum.photos/seed/campaign1/800/600'],
    50000, 35000,
    'health', 'approved',
    owner_uuid, false,
    (NOW() + INTERVAL '30 days')::DATE
  );

  -- Campaign 2: Education
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'بناء مدرسة في منطقة نائية',
    'يعيش أكثر من 500 طفل في قرية بعيدة دون مدرسة قريبة. يضطر الأطفال للسير ساعات للوصول للتعليم، مما يتسبب في تسرب كثيرين منهم.',
    ARRAY['https://picsum.photos/seed/campaign2/800/600'],
    30000, 18000,
    'education', 'approved',
    owner_uuid, false,
    NULL
  );

  -- Campaign 3: Food
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'سلال غذائية لـ 200 أسرة محتاجة',
    'مبادرة لتوزيع سلال غذائية شهرية كاملة على 200 أسرة.',
    ARRAY['https://picsum.photos/seed/campaign3/800/600'],
    20000, 15500,
    'food', 'approved',
    owner_uuid, false,
    NULL
  );

  -- Campaign 4: Water
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'حفر بئر مياه في إفريقيا',
    'قرية بأكملها تسير ساعات يومياً للحصول على مياه ملوثة.',
    ARRAY['https://picsum.photos/seed/campaign4/800/600'],
    15000, 9200,
    'water', 'approved',
    owner_uuid, false,
    NULL
  );

  -- Campaign 5: Orphans
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'كفالة 50 يتيماً لعام كامل',
    'برنامج كفالة اليتامى يوفر رعاية متكاملة للأيتام.',
    ARRAY['https://picsum.photos/seed/campaign5/800/600'],
    25000, 20000,
    'orphans', 'approved',
    owner_uuid, false,
    NULL
  );

  -- Campaign 6: Emergency
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'إغاثة المتضررين من الفيضانات',
    'فيضانات مفاجئة دمرت آلاف المنازل وشردت عائلات.',
    ARRAY['https://picsum.photos/seed/campaign6/800/600'],
    40000, 12000,
    'emergency', 'active',
    owner_uuid, false,
    (NOW() + INTERVAL '15 days')::DATE
  );

  -- Campaign 7: Pending
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount,
    category, status,
    owner_id, is_beneficiary_campaign,
    end_date
  )
  VALUES (
    'مشروع تشغيل الشباب العاطل',
    'تدريب وتأهيل 100 شاب لدخول سوق العمل.',
    ARRAY['https://picsum.photos/seed/campaign7/800/600'],
    35000, 0,
    'education', 'pending',
    owner_uuid, false,
    NULL
  );

  RAISE NOTICE 'Seed data inserted successfully for user: %', owner_uuid;
END $$;

-- ================================================
-- Verify
-- ================================================
SELECT id, title, status, target_amount, raised_amount
FROM campaigns
ORDER BY created_at DESC;