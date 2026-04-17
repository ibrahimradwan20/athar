-- ================================================
-- MIGRATION V3 SAFE VERSION
-- ================================================

-- TABLE
CREATE TABLE IF NOT EXISTS moderator_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  can_approve_campaigns BOOLEAN DEFAULT false,
  can_reject_campaigns BOOLEAN DEFAULT false,
  can_delete_campaigns BOOLEAN DEFAULT false,

  can_view_users BOOLEAN DEFAULT false,
  can_verify_users BOOLEAN DEFAULT false,
  can_toggle_donate BOOLEAN DEFAULT false,
  can_toggle_create BOOLEAN DEFAULT false,

  can_change_roles BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE moderator_permissions ENABLE ROW LEVEL SECURITY;

-- 🔥 FIX: DROP OLD POLICY FIRST
DROP POLICY IF EXISTS "Admin manages moderator permissions" ON moderator_permissions;
DROP POLICY IF EXISTS "Moderators can read own permissions" ON moderator_permissions;

-- CREATE POLICIES CLEAN
CREATE POLICY "Admin manages moderator permissions" ON moderator_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Moderators can read own permissions" ON moderator_permissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- TRIGGER SAFE
DROP TRIGGER IF EXISTS update_mod_perms_updated_at ON moderator_permissions;

CREATE TRIGGER update_mod_perms_updated_at
BEFORE UPDATE ON moderator_permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- VIEW SAFE
CREATE OR REPLACE VIEW admin_count AS
SELECT COUNT(*) as count
FROM profiles
WHERE role = 'admin';

-- DONE
SELECT 'Moderator permissions migration completed ✅' as result;