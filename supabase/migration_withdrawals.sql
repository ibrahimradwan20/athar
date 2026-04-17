-- ================================================
-- WITHDRAWALS TABLE — SAFE VERSION
-- ================================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('usdt', 'paypal')),

  usdt_wallet TEXT,
  usdt_network TEXT DEFAULT 'trc20',

  paypal_email TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),

  admin_note TEXT,
  processed_by UUID REFERENCES profiles(id),
  transaction_id TEXT,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- VIEW
-- ================================================
CREATE OR REPLACE VIEW campaign_balances AS
SELECT 
  c.id AS campaign_id,
  c.title,
  c.owner_id,
  c.raised_amount AS total_raised,
  COALESCE(SUM(w.amount) FILTER (WHERE w.status IN ('pending','processing','completed')), 0) AS withdrawn_amount,
  c.raised_amount - COALESCE(SUM(w.amount) FILTER (WHERE w.status IN ('pending','processing','completed')), 0) AS available_balance
FROM campaigns c
LEFT JOIN withdrawals w ON w.campaign_id = c.id
GROUP BY c.id, c.title, c.owner_id, c.raised_amount;

-- ================================================
-- RLS
-- ================================================
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 🔥 DROP OLD POLICIES FIRST (IMPORTANT FIX)
DROP POLICY IF EXISTS "Users see own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users create own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins update withdrawals" ON withdrawals;

-- CREATE POLICIES CLEAN
CREATE POLICY "Users see own withdrawals" ON withdrawals
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin','moderator')
    )
  );

CREATE POLICY "Users create own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Admins update withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin','moderator')
    )
  );

-- ================================================
-- TRIGGER (SAFE)
-- ================================================
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;

CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
SELECT 'Withdrawals table created successfully ✅' as result;