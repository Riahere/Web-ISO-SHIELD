-- ============================================================
-- ISO Shield — Phase 2 Schema Extension
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE control_status AS ENUM ('compliant', 'partial', 'non_compliant', 'not_applicable');
CREATE TYPE evidence_type AS ENUM ('document', 'screenshot', 'policy', 'procedure', 'log', 'certificate', 'other');

-- ============================================================
-- ISO 27001 CONTROL DOMAINS
-- ============================================================

CREATE TABLE iso_domains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- e.g., A.5
  name TEXT NOT NULL,                  -- e.g., Information Security Policies
  description TEXT,
  control_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ISO 27001 CONTROLS (Annex A)
-- ============================================================

CREATE TABLE iso_controls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain_id UUID REFERENCES iso_domains(id) ON DELETE CASCADE NOT NULL,
  control_id TEXT NOT NULL UNIQUE,     -- e.g., A.5.1.1
  name TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT CONTROL ASSESSMENTS (per organization)
-- ============================================================

CREATE TABLE control_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  control_id UUID REFERENCES iso_controls(id) ON DELETE CASCADE NOT NULL,
  status control_status NOT NULL DEFAULT 'non_compliant',
  notes TEXT,
  implementation_details TEXT,
  responsible_person TEXT,
  target_date DATE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, control_id)
);

-- ============================================================
-- EVIDENCE FILES
-- ============================================================

CREATE TABLE evidence_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  control_assessment_id UUID REFERENCES control_assessments(id) ON DELETE SET NULL,
  control_id UUID REFERENCES iso_controls(id) ON DELETE SET NULL,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,              -- Supabase storage path
  file_size INTEGER,                    -- bytes
  file_type TEXT,                       -- MIME type
  evidence_type evidence_type DEFAULT 'document',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE iso_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

-- Public read for domain/control catalog
CREATE POLICY "iso_domains_select" ON iso_domains FOR SELECT USING (true);
CREATE POLICY "iso_controls_select" ON iso_controls FOR SELECT USING (true);

-- Control assessments — org members only
CREATE POLICY "assessments_select" ON control_assessments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "assessments_insert" ON control_assessments FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "assessments_update" ON control_assessments FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "assessments_delete" ON control_assessments FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Evidence — org members only
CREATE POLICY "evidence_select" ON evidence_files FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "evidence_insert" ON evidence_files FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "evidence_delete" ON evidence_files FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON control_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_control_assessments_org ON control_assessments(organization_id);
CREATE INDEX idx_control_assessments_status ON control_assessments(status);
CREATE INDEX idx_evidence_org ON evidence_files(organization_id);
CREATE INDEX idx_evidence_control ON evidence_files(control_id);
CREATE INDEX idx_iso_controls_domain ON iso_controls(domain_id);

-- ============================================================
-- SEED ISO 27001:2013 CONTROL DOMAINS & CONTROLS
-- ============================================================

INSERT INTO iso_domains (code, name, description, sort_order) VALUES
('A.5',  'Information Security Policies', 'Management direction for information security', 1),
('A.6',  'Organization of Information Security', 'Internal and mobile working security', 2),
('A.7',  'Human Resource Security', 'Before, during and after employment', 3),
('A.8',  'Asset Management', 'Responsibility for and classification of assets', 4),
('A.9',  'Access Control', 'Business requirements and user responsibilities', 5),
('A.10', 'Cryptography', 'Cryptographic controls', 6),
('A.11', 'Physical and Environmental Security', 'Secure areas and equipment', 7),
('A.12', 'Operations Security', 'Operational procedures and responsibilities', 8),
('A.13', 'Communications Security', 'Network and information transfer security', 9),
('A.14', 'System Acquisition, Development and Maintenance', 'Security requirements and processes', 10),
('A.15', 'Supplier Relationships', 'Information security in supplier agreements', 11),
('A.16', 'Information Security Incident Management', 'Incident reporting and response', 12),
('A.17', 'Business Continuity Management', 'ICT continuity and redundancies', 13),
('A.18', 'Compliance', 'Legal, contractual and technical compliance', 14);

-- A.5 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.5.1.1', 'Policies for Information Security',
  'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.',
  'Define an overarching information security policy supported by topic-specific policies. Ensure policies are approved at board level, communicated to all staff, and reviewed annually.',
  true, 1 FROM iso_domains WHERE code = 'A.5';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.5.1.2', 'Review of the Policies for Information Security',
  'The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy, and effectiveness.',
  'Schedule annual policy reviews. Document review outcomes. Update policies when organizational or technical changes occur.',
  2 FROM iso_domains WHERE code = 'A.5';

-- A.6 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.6.1.1', 'Information Security Roles and Responsibilities',
  'All information security responsibilities shall be defined and allocated.',
  'Define RACI matrix for security roles. Assign CISO or equivalent. Document responsibilities in job descriptions.',
  1 FROM iso_domains WHERE code = 'A.6';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.6.1.2', 'Segregation of Duties',
  'Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization''s assets.',
  'Identify conflicting roles. Implement compensating controls where segregation is not feasible. Document exceptions.',
  2 FROM iso_domains WHERE code = 'A.6';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.6.1.5', 'Information Security in Project Management',
  'Information security shall be addressed in project management, regardless of the type of the project.',
  'Include security requirements in project methodology. Assign security review checkpoints. Conduct security sign-off before go-live.',
  3 FROM iso_domains WHERE code = 'A.6';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.6.2.1', 'Mobile Device Policy',
  'A policy and supporting security measures shall be adopted to manage the risks introduced by using mobile devices.',
  'Define MDM requirements. Enforce encryption, remote wipe, PIN lock. Address BYOD risks.',
  4 FROM iso_domains WHERE code = 'A.6';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.6.2.2', 'Teleworking',
  'A policy and supporting security measures shall be implemented to protect information accessed, processed or stored at teleworking sites.',
  'Establish secure remote access (VPN). Define clear desk policy. Provide security awareness for remote workers.',
  5 FROM iso_domains WHERE code = 'A.6';

-- A.7 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.7.1.1', 'Screening',
  'Background verification checks on all candidates for employment shall be carried out in accordance with relevant laws, regulations and ethics.',
  'Conduct background checks proportional to risk. Include criminal record, reference, and qualification verification.',
  1 FROM iso_domains WHERE code = 'A.7';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.7.2.2', 'Information Security Awareness, Education and Training',
  'All employees of the organization and, where relevant, contractors shall receive appropriate awareness education and training and regular updates in organizational policies and procedures.',
  'Implement annual security awareness training. Track completion. Include phishing simulations and role-based training.',
  2 FROM iso_domains WHERE code = 'A.7';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.7.3.1', 'Termination or Change of Employment Responsibilities',
  'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, communicated to the employee or contractor and enforced.',
  'Define offboarding checklist. Revoke access on day of termination. Collect all assets and credentials.',
  3 FROM iso_domains WHERE code = 'A.7';

-- A.8 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.8.1.1', 'Inventory of Assets',
  'Assets associated with information and information processing facilities shall be identified and an inventory of these assets shall be drawn up and maintained.',
  'Maintain comprehensive asset register. Include hardware, software, data, services. Update upon change.',
  true, 1 FROM iso_domains WHERE code = 'A.8';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.8.1.2', 'Ownership of Assets',
  'Assets maintained in the inventory shall be owned.',
  'Assign asset owners. Document in asset inventory. Owners responsible for classification and protection.',
  2 FROM iso_domains WHERE code = 'A.8';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.8.2.1', 'Classification of Information',
  'Information shall be classified in terms of legal requirements, value, criticality and sensitivity to unauthorized disclosure or modification.',
  'Define classification scheme (e.g., Public, Internal, Confidential, Restricted). Apply labels consistently.',
  3 FROM iso_domains WHERE code = 'A.8';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.8.3.1', 'Management of Removable Media',
  'Procedures shall be implemented for the management of removable media in accordance with the classification scheme adopted by the organization.',
  'Control use of USB drives. Encrypt data on removable media. Maintain logs of usage.',
  4 FROM iso_domains WHERE code = 'A.8';

-- A.9 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.9.1.1', 'Access Control Policy',
  'An access control policy shall be established, documented and reviewed based on business and information security requirements.',
  'Document access control policy covering need-to-know, need-to-use, least privilege. Review annually.',
  true, 1 FROM iso_domains WHERE code = 'A.9';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.9.2.1', 'User Registration and De-registration',
  'A formal user registration and de-registration procedure shall be implemented to enable assignment of access rights.',
  'Implement formal provisioning process. Require manager approval. Log all access grants and revocations.',
  2 FROM iso_domains WHERE code = 'A.9';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.9.2.3', 'Management of Privileged Access Rights',
  'The allocation and use of privileged access rights shall be restricted and controlled.',
  'Restrict privileged accounts. Use PAM tools. Require MFA for admin access. Review quarterly.',
  3 FROM iso_domains WHERE code = 'A.9';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.9.2.4', 'Management of Secret Authentication Information of Users',
  'The allocation of secret authentication information shall be controlled through a formal management process.',
  'Enforce strong password policy. Implement MFA. Use password managers. No shared accounts.',
  4 FROM iso_domains WHERE code = 'A.9';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.9.4.1', 'Information Access Restriction',
  'Access to information and application system functions shall be restricted in accordance with the access control policy.',
  'Implement role-based access control. Apply least privilege. Review access rights regularly.',
  5 FROM iso_domains WHERE code = 'A.9';

-- A.10 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.10.1.1', 'Policy on the Use of Cryptographic Controls',
  'A policy on the use of cryptographic controls for protection of information shall be developed and implemented.',
  'Define approved cryptographic algorithms. Mandate encryption for data in transit and at rest. Include key management.',
  true, 1 FROM iso_domains WHERE code = 'A.10';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.10.1.2', 'Key Management',
  'A policy on the use, protection and lifetime of cryptographic keys shall be developed and implemented.',
  'Implement key lifecycle management. Store keys securely (HSM). Define rotation schedules.',
  2 FROM iso_domains WHERE code = 'A.10';

-- A.11 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.11.1.1', 'Physical Security Perimeter',
  'Security perimeters shall be defined and used to protect areas that contain either sensitive or critical information and information processing facilities.',
  'Define physical security zones. Implement access controls (badge, biometric). Monitor entry/exit.',
  1 FROM iso_domains WHERE code = 'A.11';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.11.2.1', 'Equipment Siting and Protection',
  'Equipment shall be sited and protected to reduce the risks from environmental threats and hazards, and opportunities for unauthorized access.',
  'Place servers in secure data centers. Implement environmental monitoring. Use UPS and redundant power.',
  2 FROM iso_domains WHERE code = 'A.11';

-- A.12 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.12.1.1', 'Documented Operating Procedures',
  'Operating procedures shall be documented and made available to all users who need them.',
  'Document all standard operating procedures. Version control documents. Ensure accessibility.',
  true, 1 FROM iso_domains WHERE code = 'A.12';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.12.2.1', 'Controls Against Malware',
  'Detection, prevention and recovery controls to protect against malware shall be implemented, combined with appropriate user awareness.',
  'Deploy EDR/antivirus on all endpoints. Keep signatures updated. Train users on phishing.',
  2 FROM iso_domains WHERE code = 'A.12';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.12.3.1', 'Information Backup',
  'Backup copies of information, software and system images shall be taken and tested regularly in accordance with an agreed backup policy.',
  'Define RPO/RTO. Implement 3-2-1 backup strategy. Test restores quarterly. Encrypt backups.',
  3 FROM iso_domains WHERE code = 'A.12';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.12.4.1', 'Event Logging',
  'Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed.',
  'Enable logging on all critical systems. Centralize logs (SIEM). Define retention period. Review alerts daily.',
  4 FROM iso_domains WHERE code = 'A.12';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.12.6.1', 'Management of Technical Vulnerabilities',
  'Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion.',
  'Implement vulnerability scanning. Subscribe to security advisories. Define patch SLAs by severity.',
  5 FROM iso_domains WHERE code = 'A.12';

-- A.13 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.13.1.1', 'Network Controls',
  'Networks shall be managed and controlled to protect information in systems and applications.',
  'Segment networks by sensitivity. Implement firewall rules. Monitor network traffic. Use IDS/IPS.',
  1 FROM iso_domains WHERE code = 'A.13';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.13.2.1', 'Information Transfer Policies and Procedures',
  'Formal transfer policies, procedures and controls shall be in place to protect the transfer of information through the use of all types of communication facilities.',
  'Define acceptable use for data transfer. Encrypt sensitive data in transit. Log transfers of sensitive data.',
  2 FROM iso_domains WHERE code = 'A.13';

-- A.14 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.14.1.1', 'Information Security Requirements Analysis and Specification',
  'The information security related requirements shall be included in the requirements for new information systems or enhancements to existing information systems.',
  'Include security requirements in system design. Conduct threat modeling. Define security acceptance criteria.',
  1 FROM iso_domains WHERE code = 'A.14';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.14.2.1', 'Secure Development Policy',
  'Rules for the development of software and systems shall be established and applied to developments within the organization.',
  'Define SDLC with security gates. Implement code review. Use SAST/DAST tools. Train developers in secure coding.',
  2 FROM iso_domains WHERE code = 'A.14';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.14.2.8', 'System Security Testing',
  'Testing of security functionality shall be carried out during development.',
  'Conduct security testing at each development stage. Include penetration testing before major releases.',
  3 FROM iso_domains WHERE code = 'A.14';

-- A.15 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.15.1.1', 'Information Security Policy for Supplier Relationships',
  'Information security requirements for mitigating the risks associated with supplier''s access to the organization''s assets shall be agreed with the supplier and documented.',
  'Define supplier security requirements. Include security clauses in contracts. Assess supplier security annually.',
  1 FROM iso_domains WHERE code = 'A.15';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.15.2.1', 'Monitoring and Review of Supplier Services',
  'Organizations shall regularly monitor, review and audit supplier service delivery.',
  'Schedule annual supplier audits. Review security incidents from suppliers. Track SLA compliance.',
  2 FROM iso_domains WHERE code = 'A.15';

-- A.16 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.16.1.1', 'Responsibilities and Procedures',
  'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents.',
  'Define incident response team. Document IRP. Conduct tabletop exercises. Define escalation paths.',
  true, 1 FROM iso_domains WHERE code = 'A.16';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.16.1.2', 'Reporting Information Security Events',
  'Information security events shall be reported through appropriate management channels as quickly as possible.',
  'Establish clear reporting channels. Train staff on incident reporting. Define what constitutes an incident.',
  2 FROM iso_domains WHERE code = 'A.16';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.16.1.6', 'Learning from Information Security Incidents',
  'Knowledge gained from analysing and resolving information security incidents shall be used to reduce the likelihood or impact of future incidents.',
  'Conduct post-incident reviews. Document lessons learned. Update controls based on findings.',
  3 FROM iso_domains WHERE code = 'A.16';

-- A.17 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.17.1.1', 'Planning Information Security Continuity',
  'The organization shall determine its requirements for information security and the continuity of information security management in adverse situations.',
  'Integrate security into BCP/DRP. Define security requirements for continuity scenarios.',
  1 FROM iso_domains WHERE code = 'A.17';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.17.1.3', 'Verify, Review and Evaluate Information Security Continuity',
  'The organization shall verify the established and implemented information security continuity controls at regular intervals in order to ensure that they are valid and effective.',
  'Test BCP annually. Document test results. Update plans based on test outcomes.',
  2 FROM iso_domains WHERE code = 'A.17';

-- A.18 Controls
INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, is_mandatory, sort_order)
SELECT id, 'A.18.1.1', 'Identification of Applicable Legislation and Contractual Requirements',
  'All relevant legislative statutory, regulatory, contractual requirements and the organization''s approach to meet these requirements shall be explicitly identified, documented and kept up to date.',
  'Maintain legal register. Include GDPR, PDP, sector-specific regulations. Review when laws change.',
  true, 1 FROM iso_domains WHERE code = 'A.18';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.18.1.3', 'Protection of Records',
  'Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release, in accordance with legislatory, regulatory, contractual, and business requirements.',
  'Define record retention policy. Implement access controls. Ensure records are tamper-proof.',
  2 FROM iso_domains WHERE code = 'A.18';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.18.2.1', 'Independent Review of Information Security',
  'The organization''s approach to managing information security and its implementation shall be reviewed independently at planned intervals or when significant changes occur.',
  'Conduct annual internal audit. Engage external auditors. Address findings systematically.',
  3 FROM iso_domains WHERE code = 'A.18';

INSERT INTO iso_controls (domain_id, control_id, name, description, guidance, sort_order)
SELECT id, 'A.18.2.3', 'Technical Compliance Review',
  'Information systems shall be regularly reviewed for compliance with the organization''s information security policies and standards.',
  'Run automated compliance scans. Review system configurations against baselines. Document exceptions.',
  4 FROM iso_domains WHERE code = 'A.18';

-- Update control counts per domain
UPDATE iso_domains SET control_count = (
  SELECT COUNT(*) FROM iso_controls WHERE iso_controls.domain_id = iso_domains.id
);

-- ============================================================
-- STORAGE BUCKET (run in Supabase dashboard or via API)
-- ============================================================
-- Create a bucket called 'evidence' with:
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/*, text/*, application/msword, application/vnd.openxmlformats-officedocument.*
--
-- Then add storage policies:
-- INSERT: authenticated users only
-- SELECT: org members only (via join)
