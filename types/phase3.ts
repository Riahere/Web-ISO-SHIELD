export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational'
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'accepted' | 'closed'
export type FindingSource = 'risk_assessment' | 'checklist' | 'manual' | 'ai_generated'

export interface AuditFinding {
  id: string
  organization_id: string
  title: string
  description: string
  severity: FindingSeverity
  status: FindingStatus
  source: FindingSource
  affected_asset_id: string | null
  related_control_id: string | null
  vulnerability_id: string | null
  risk_level: string | null
  risk_score: number | null
  likelihood: number | null
  impact: number | null
  recommendation: string | null
  remediation_deadline: string | null
  remediation_owner: string | null
  remediation_notes: string | null
  ai_generated: boolean
  ai_explanation: string | null
  finding_number: string | null
  created_by: string | null
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  // joined
  asset?: { name: string; type: string } | null
  control?: { control_id: string; name: string } | null
  vulnerability?: { name: string; owasp_id: string } | null
}

export interface AuditReport {
  id: string
  organization_id: string
  title: string
  version: string
  status: string
  executive_summary: string | null
  scope_description: string | null
  methodology: string | null
  snapshot: ReportSnapshot | null
  auditor_name: string | null
  audit_date: string | null
  next_audit_date: string | null
  final_opinion: 'certified' | 'conditional' | 'not_certified' | null
  opinion_notes: string | null
  generated_by: string | null
  generated_at: string
  created_at: string
  updated_at: string
}

export interface ReportSnapshot {
  organization: {
    name: string
    sector: string
    employee_count: number | null
    exposure_level: string
    audit_period_start: string | null
    audit_period_end: string | null
    scope_description: string | null
  }
  assets: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    byType: Record<string, number>
  }
  risks: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    negligible: number
  }
  compliance: {
    score: number
    coverage: number
    total: number
    compliant: number
    partial: number
    nonCompliant: number
    notApplicable: number
  }
  findings: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    informational: number
    open: number
    resolved: number
  }
  generatedAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AiChatSession {
  id: string
  organization_id: string
  user_id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}
