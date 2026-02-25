-- ============================================================
-- ISO Shield — Invite System Migration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tabel untuk menyimpan invite link
CREATE TABLE organization_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role user_role NOT NULL DEFAULT 'auditee',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS untuk invites
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Admin org bisa buat & lihat invite
CREATE POLICY "invites_select" ON organization_invites FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "invites_insert" ON organization_invites FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "invites_update" ON organization_invites FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "invites_delete" ON organization_invites FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Siapapun bisa READ invite by token (untuk validasi saat register)
-- Ini perlu karena user belum login saat buka invite link
CREATE POLICY "invites_public_read_by_token" ON organization_invites FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Index untuk pencarian token
CREATE INDEX idx_invites_token ON organization_invites(token);
CREATE INDEX idx_invites_org ON organization_invites(organization_id);

-- ============================================================
-- Update RLS profiles agar admin bisa update role member lain
-- di organisasi yang sama
-- ============================================================

-- Hapus policy lama yang hanya bisa update diri sendiri
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- Policy baru: bisa update diri sendiri
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policy baru: admin bisa update role member di org yang sama
CREATE POLICY "profiles_update_by_admin" ON profiles FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin bisa READ semua profiles di org yang sama
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select_self" ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_org_members" ON profiles FOR SELECT
  USING (
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin bisa lihat user yang belum punya org (unassigned)
-- untuk fitur manual assign
CREATE POLICY "profiles_select_unassigned_by_admin" ON profiles FOR SELECT
  USING (
    organization_id IS NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );