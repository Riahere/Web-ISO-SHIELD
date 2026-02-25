-- ============================================================
-- ISO Shield — Phase 3 Schema Extension
-- Run AFTER schema_phase2.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE finding_severity AS ENUM ('critical', 'high', 'medium', 'low', 'informational');
CREATE TYPE finding_status AS ENUM ('open', 'in_progress', 'resolved', 'accepted', 'closed');
CREATE TYPE finding_source AS ENUM ('risk_assessment', 'checklist', 'manual', 'ai_generated');

-- ============================================================
-- AUDIT FINDINGS
-- ============================================================

CREATE TABLE audit_findings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Finding details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity finding_severity NOT NULL DEFAULT 'medium',
  status finding_status NOT NULL DEFAULT 'open',
  source finding_source NOT NULL DEFAULT 'manual',
  
  -- References
  affected_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  related_control_id UUID REFERENCES iso_controls(id) ON DELETE SET NULL,
  vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE SET NULL,
  
  -- Risk details
  risk_level TEXT,
  risk_score NUMERIC(4,2),
  likelihood INTEGER,
  impact INTEGER,
  
  -- Remediation
  recommendation TEXT,
  remediation_deadline DATE,
  remediation_owner TEXT,
  remediation_notes TEXT,
  
  -- AI fields
  ai_generated BOOLEAN DEFAULT false,
  ai_explanation TEXT,
  
  -- Tracking
  finding_number TEXT, -- e.g., F-001
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT REPORTS
-- ============================================================

CREATE TABLE audit_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft', -- draft, final
  
  -- Report sections (JSONB for flexibility)
  executive_summary TEXT,
  scope_description TEXT,
  methodology TEXT,
  
  -- Snapshot data at time of report generation
  snapshot JSONB, -- stores stats, findings, compliance scores
  
  -- Audit info
  auditor_name TEXT,
  audit_date DATE,
  next_audit_date DATE,
  final_opinion TEXT, -- 'certified', 'conditional', 'not_certified'
  opinion_notes TEXT,
  
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CHAT HISTORY
-- ============================================================

CREATE TABLE ai_chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "findings_select" ON audit_findings FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "findings_insert" ON audit_findings FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "findings_update" ON audit_findings FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "findings_delete" ON audit_findings FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "reports_select" ON audit_reports FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "reports_insert" ON audit_reports FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "reports_update" ON audit_reports FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "reports_delete" ON audit_reports FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "ai_sessions_select" ON ai_chat_sessions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "ai_sessions_insert" ON ai_chat_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_sessions_update" ON ai_chat_sessions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "ai_sessions_delete" ON ai_chat_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_findings_updated_at
  BEFORE UPDATE ON audit_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON audit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ai_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set finding number
CREATE OR REPLACE FUNCTION set_finding_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(finding_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM audit_findings
  WHERE organization_id = NEW.organization_id
    AND finding_number IS NOT NULL;
  NEW.finding_number := 'F-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_finding_number
  BEFORE INSERT ON audit_findings
  FOR EACH ROW EXECUTE FUNCTION set_finding_number();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_findings_org ON audit_findings(organization_id);
CREATE INDEX idx_findings_severity ON audit_findings(severity);
CREATE INDEX idx_findings_status ON audit_findings(status);
CREATE INDEX idx_reports_org ON audit_reports(organization_id);
CREATE INDEX idx_ai_sessions_user ON ai_chat_sessions(user_id);
