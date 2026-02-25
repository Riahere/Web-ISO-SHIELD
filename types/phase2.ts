export type control_status = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable'
export type evidence_type = 'document' | 'screenshot' | 'policy' | 'procedure' | 'log' | 'certificate' | 'other'

export interface IsoDomain {
  id: string
  code: string
  name: string
  description: string | null
  control_count: number
  sort_order: number
  created_at: string
}

export interface IsoControl {
  id: string
  domain_id: string
  control_id: string
  name: string
  description: string | null
  guidance: string | null
  is_mandatory: boolean
  sort_order: number
  created_at: string
}

export interface ControlAssessment {
  id: string
  organization_id: string
  control_id: string
  status: control_status
  notes: string | null
  implementation_details: string | null
  responsible_person: string | null
  target_date: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EvidenceFile {
  id: string
  organization_id: string
  control_assessment_id: string | null
  control_id: string | null
  file_name: string
  file_path: string
  file_size: number | null
  file_type: string | null
  evidence_type: evidence_type
  description: string | null
  tags: string[]
  uploaded_by: string | null
  uploaded_at: string
  created_at: string
  // joined
  control?: { control_id: string; name: string } | null
}

export interface DomainWithControls extends IsoDomain {
  iso_controls: (IsoControl & { assessment: ControlAssessment | null })[]
}

export interface DomainStats extends IsoDomain {
  assessed: number
  compliant: number
  partial: number
  non_compliant: number
  not_applicable: number
  score: number
}

export interface ComplianceStats {
  totalControls: number
  assessed: number
  compliant: number
  partial: number
  nonCompliant: number
  notApplicable: number
  complianceScore: number
  coverage: number
  domainStats: DomainStats[]
}



