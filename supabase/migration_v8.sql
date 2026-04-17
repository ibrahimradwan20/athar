-- ================================================
-- ATHAR v8 — FIXED (Idempotent Policies)
-- ================================================

-- ── CHAT ROOMS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'campaign'
    CHECK (type IN ('campaign', 'direct')),
  created_by UUID REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHAT ROOM MEMBERS ─────────────────────────────
CREATE TABLE IF NOT EXISTS chat_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ── CHAT MESSAGES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image','video','file') OR media_type IS NULL),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CAMPAIGN COMMENTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CAMPAIGN REACTIONS ────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'like' CHECK (type IN ('like','heart','support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- ── MODERATOR PERMISSIONS ─────────────────────────
ALTER TABLE moderator_permissions
  ADD COLUMN IF NOT EXISTS can_chat BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_comments BOOLEAN DEFAULT false;

-- ── COMMENTS LOCK ────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS comments_locked BOOLEAN DEFAULT false;

-- ── RLS ENABLE ───────────────────────────────────
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reactions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICIES (SAFE CREATE)
-- ================================================

DO $$
BEGIN

-- chat_rooms
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_rooms_select') THEN
  CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chat_members WHERE room_id = id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_rooms_insert') THEN
  CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_rooms_update') THEN
  CREATE POLICY "chat_rooms_update" ON chat_rooms FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
END IF;

-- chat_members
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_members_select') THEN
  CREATE POLICY "chat_members_select" ON chat_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_members_insert') THEN
  CREATE POLICY "chat_members_insert" ON chat_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
    OR user_id = auth.uid()
  );
END IF;

-- chat_messages
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_messages_select') THEN
  CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chat_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_messages_insert') THEN
  CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM chat_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()) AND
    NOT EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_messages.room_id AND is_locked = true)
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='chat_messages_update') THEN
  CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE
  USING (
    sender_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

-- comments
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='comments_select') THEN
  CREATE POLICY "comments_select" ON campaign_comments FOR SELECT
  USING (
    is_hidden = false OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='comments_insert') THEN
  CREATE POLICY "comments_insert" ON campaign_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND comments_locked = true)
  );
END IF;

-- reactions
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reactions_select') THEN
  CREATE POLICY "reactions_select" ON campaign_reactions FOR SELECT USING (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reactions_insert') THEN
  CREATE POLICY "reactions_insert" ON campaign_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reactions_delete') THEN
  CREATE POLICY "reactions_delete" ON campaign_reactions FOR DELETE
  USING (auth.uid() = user_id);
END IF;

END $$;

-- ================================================
-- DONE
-- ================================================

SELECT 'Migration v8 FIXED ✅ (No duplicate policy errors)' as result;