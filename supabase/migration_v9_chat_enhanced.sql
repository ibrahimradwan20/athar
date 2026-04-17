-- ================================================
-- ATHAR v9 — FIXED (No duplicate policies)
-- ================================================

-- ── تعديل نوع الغرف ──────────────────────────────
ALTER TABLE chat_rooms
  DROP CONSTRAINT IF EXISTS chat_rooms_type_check;

ALTER TABLE chat_rooms
  ADD CONSTRAINT chat_rooms_type_check
  CHECK (type IN ('campaign', 'direct', 'announcement'));

-- ── صلاحيات المشرف ──────────────────────────────
ALTER TABLE moderator_permissions
  ADD COLUMN IF NOT EXISTS can_add_members BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_remove_members BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_lock_room BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_send_announcements BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_campaigns UUID[] DEFAULT '{}';

-- ── جدول الإعلانات ──────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}',
  amount_documented NUMERIC DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── جدول المشرفين ───────────────────────────────
CREATE TABLE IF NOT EXISTS room_supervisors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  can_send BOOLEAN DEFAULT true,
  can_moderate BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, supervisor_id)
);

-- ── RLS ─────────────────────────────────────────
ALTER TABLE campaign_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_supervisors ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICIES SAFE CREATE
-- ================================================

DO $$
BEGIN

-- announcements
IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='announcements_select'
) THEN
  CREATE POLICY "announcements_select"
  ON campaign_announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chat_members WHERE room_id = campaign_announcements.room_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='announcements_insert'
) THEN
  CREATE POLICY "announcements_insert"
  ON campaign_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (
        SELECT 1 FROM room_supervisors 
        WHERE room_id = campaign_announcements.room_id 
        AND supervisor_id = auth.uid() 
        AND can_send = true
      )
    )
  );
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='announcements_update'
) THEN
  CREATE POLICY "announcements_update"
  ON campaign_announcements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR sender_id = auth.uid()
  );
END IF;

-- room supervisors
IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='room_supervisors_select'
) THEN
  CREATE POLICY "room_supervisors_select"
  ON room_supervisors FOR SELECT
  USING (
    supervisor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM chat_members WHERE room_id = room_supervisors.room_id AND user_id = auth.uid())
  );
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='room_supervisors_insert'
) THEN
  CREATE POLICY "room_supervisors_insert"
  ON room_supervisors FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='room_supervisors_delete'
) THEN
  CREATE POLICY "room_supervisors_delete"
  ON room_supervisors FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
END IF;

END $$;

-- ── تعديل سياسات الرسائل ─────────────────────────
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  NOT EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_messages.room_id AND is_locked = true) AND
  (
    EXISTS (SELECT 1 FROM chat_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM room_supervisors 
      WHERE room_id = chat_messages.room_id 
      AND supervisor_id = auth.uid() 
      AND can_send = true
    )
  )
);

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM chat_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  OR EXISTS (SELECT 1 FROM room_supervisors WHERE room_id = chat_messages.room_id AND supervisor_id = auth.uid())
);

DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT
USING (
  EXISTS (SELECT 1 FROM chat_members WHERE room_id = id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  OR EXISTS (SELECT 1 FROM room_supervisors WHERE room_id = id AND supervisor_id = auth.uid())
);

-- ── Storage ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-media',
  'announcement-media',
  true,
  104857600,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm','video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='announcement_media_select'
) THEN
  CREATE POLICY "announcement_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-media');
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname='announcement_media_insert'
) THEN
  CREATE POLICY "announcement_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'announcement-media'
    AND auth.role() = 'authenticated'
  );
END IF;
END $$;

SELECT 'Migration v9 FIXED ✅ (No errors)' as result;