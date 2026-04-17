-- ================================================
-- بيانات تجريبية - حملات غزة وفلسطين
-- شغّل هذا في Supabase SQL Editor بعد migration_v2.sql
-- ================================================

DO $$
DECLARE
  owner_uuid UUID;
BEGIN
  -- Get admin or first user
  SELECT id INTO owner_uuid FROM profiles WHERE role = 'admin' LIMIT 1;
  IF owner_uuid IS NULL THEN
    SELECT id INTO owner_uuid FROM profiles LIMIT 1;
  END IF;
  IF owner_uuid IS NULL THEN
    RAISE NOTICE 'لا يوجد مستخدمون. أنشئ حساباً أولاً ثم شغّل هذا الملف.';
    RETURN;
  END IF;

  -- حذف الحملات القديمة الوهمية إن وُجدت
  DELETE FROM campaigns WHERE location IS NULL OR location NOT LIKE '%فلسطين%' OR location NOT LIKE '%غزة%';

  -- ═══════════════════════════════════════
  -- حملة 1: علاج الجرحى في غزة
  -- ═══════════════════════════════════════
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount, donors_count,
    category, status, owner_id,
    is_beneficiary_campaign, location, end_date, tags
  ) VALUES (
    'إنقاذ جرحى غزة — أدوية وعمليات عاجلة',
    E'تعاني مستشفيات غزة من نقص حاد في الأدوية والمستلزمات الطبية في ظل الحصار المتواصل. آلاف الجرحى ينتظرون العلاج، وكثير منهم أطفال لم يتجاوزوا سنوات عمرهم القليلة.\n\nما سيُصرف عليه تبرعك:\n🏥 أدوية جراحية وتخدير\n💊 مضادات حيوية ومسكنات\n🔋 وقود لمولدات المستشفيات\n🩸 أكياس دم ومعدات نقل\n\nكل دولار قد يعني الفرق بين الحياة والموت لجريح في غزة. لا تتأخر.',
    ARRAY[
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80'
    ],
    150000, 98750, 2847,
    'health', 'approved', owner_uuid,
    false, 'غزة، فلسطين',
    (NOW() + INTERVAL '60 days')::DATE,
    ARRAY['غزة', 'فلسطين', 'طوارئ', 'مستشفى', 'جرحى']
  );

  -- ═══════════════════════════════════════
  -- حملة 2: إيواء نازحي رفح
  -- ═══════════════════════════════════════
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount, donors_count,
    category, status, owner_id,
    is_beneficiary_campaign, location, end_date, tags
  ) VALUES (
    'خيام ودفء لنازحي رفح — قبل الشتاء',
    E'أكثر من مليون نازح فلسطيني يكتظون في محيط رفح جنوب غزة، يعيشون في خيام ممزقة لا تقيهم حراً ولا برداً. مع اقتراب فصل الشتاء، تتصاعد المخاوف على حياة الأطفال والنساء وكبار السن.\n\nحملتنا تهدف لـ:\n⛺ توفير 500 خيمة مقاومة للطقس\n🧥 توزيع بطانيات وملابس شتوية\n💧 مياه نظيفة وأدوات صحية\n🍞 حصص غذائية شهرية لـ 300 أسرة\n👶 حزمة خاصة للأمهات والرضّع\n\nكل تبرع يعني أسرة بدفء هذا الشتاء.',
    ARRAY[
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80'
    ],
    200000, 134200, 4103,
    'shelter', 'approved', owner_uuid,
    false, 'رفح، غزة، فلسطين',
    (NOW() + INTERVAL '45 days')::DATE,
    ARRAY['غزة', 'رفح', 'نازحون', 'إيواء', 'شتاء']
  );

  -- ═══════════════════════════════════════
  -- حملة 3: تعليم أطفال غزة
  -- ═══════════════════════════════════════
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount, donors_count,
    category, status, owner_id,
    is_beneficiary_campaign, location, end_date, tags
  ) VALUES (
    'التعليم مستمر — مدارس بديلة لأطفال غزة',
    E'دمّرت الحرب مئات المدارس في غزة، وحُرم أكثر من 600,000 طالب من حقهم في التعليم. الأطفال يقضون أيامهم في المخيمات دون تعليم أو نشاط، مما يعرضهم لصدمات نفسية عميقة.\n\nمشروعنا يهدف إلى:\n📚 إنشاء 20 فصلاً دراسياً مؤقتاً في المخيمات\n✏️ توفير قرطاسية وكتب مدرسية\n👩‍🏫 تأمين رواتب 50 معلماً متطوعاً\n🖥️ أجهزة حاسوب محمولة للتعلم الرقمي\n\nاستثمر في مستقبل جيل كامل.',
    ARRAY[
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80'
    ],
    80000, 31500, 1203,
    'education', 'approved', owner_uuid,
    false, 'غزة، فلسطين',
    (NOW() + INTERVAL '90 days')::DATE,
    ARRAY['غزة', 'تعليم', 'أطفال', 'فلسطين']
  );

  -- ═══════════════════════════════════════
  -- حملة 4: مياه نظيفة - الضفة الغربية
  -- ═══════════════════════════════════════
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount, donors_count,
    category, status, owner_id,
    is_beneficiary_campaign, location, tags
  ) VALUES (
    'مياه نقية لقرى الضفة الغربية',
    E'تعاني عشرات القرى في الضفة الغربية من شُح المياه النظيفة وتلوثها، مما يهدد صحة أكثر من 15,000 شخص. الأطفال هم الأكثر تضرراً، إذ تنتشر بينهم الأمراض الناجمة عن شرب المياه الملوثة.\n\nمشروعنا يشمل:\n💧 حفر 3 آبار ارتوازية جديدة\n🏗️ بناء خزانات مياه في 5 قرى\n🔧 تركيب شبكات توزيع مياه نظيفة\n🧪 أجهزة تحليل وتنقية المياه\n\nالمياه حق، لا امتياز.',
    ARRAY[
      'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80'
    ],
    45000, 28900, 891,
    'water', 'approved', owner_uuid,
    false, 'الضفة الغربية، فلسطين',
    ARRAY['فلسطين', 'الضفة', 'مياه', 'قرى']
  );

  -- ═══════════════════════════════════════
  -- حملة 5: أيتام غزة (حملة مستفيد فردي)
  -- ═══════════════════════════════════════
  INSERT INTO campaigns (
    title, description, images,
    target_amount, raised_amount, donors_count,
    category, status, owner_id,
    is_beneficiary_campaign, location, end_date, tags
  ) VALUES (
    'كفالة 100 يتيم من أيتام غزة',
    E'خلّفت الحرب آلاف الأيتام في غزة — أطفال فقدوا آباءهم وأمهاتهم ويحتاجون الآن إلى من يكفلهم ويرعاهم.\n\nبرنامج الكفالة يوفر لكل يتيم:\n🏠 سكناً آمناً مع عائلة بديلة\n🍽️ وجبات غذائية كاملة يومياً\n📚 مصاريف تعليمية كاملة\n🩺 رعاية صحية شاملة\n👕 ملابس وأغراض شخصية\n\nكفالتك = حياة كريمة لطفل يتيم.',
    ARRAY[
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80'
    ],
    60000, 52100, 1876,
    'orphans', 'approved', owner_uuid,
    true, 'غزة، فلسطين',
    (NOW() + INTERVAL '120 days')::DATE,
    ARRAY['غزة', 'أيتام', 'فلسطين', 'كفالة']
  );

  RAISE NOTICE '✅ تم إدراج الحملات بنجاح للمستخدم: %', owner_uuid;
END $$;

-- تحقق
SELECT title, location, status, target_amount, raised_amount, donors_count
FROM campaigns ORDER BY created_at DESC LIMIT 10;
