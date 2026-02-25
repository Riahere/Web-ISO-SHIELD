'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FindingSeverity, FindingStatus, AuditFinding } from '@/types/phase3'

export async function getFindings(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('audit_findings')
    .select(`
      *,
      asset:assets(name, type),
      control:iso_controls(control_id, name),
      vulnerability:vulnerabilities(name, owasp_id)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AuditFinding[]
}

export async function createFinding(
  organizationId: string,
  data: {
    title: string
    description: string
    severity: FindingSeverity
    source: 'manual' | 'checklist' | 'risk_assessment' | 'ai_generated'
    affected_asset_id?: string
    related_control_id?: string
    vulnerability_id?: string
    risk_level?: string
    risk_score?: number
    likelihood?: number
    impact?: number
    recommendation?: string
    remediation_deadline?: string
    remediation_owner?: string
    ai_generated?: boolean
    ai_explanation?: string
  }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('audit_findings').insert({
    organization_id: organizationId,
    created_by: user.id,
    status: 'open',
    ...data,
  })

  if (error) return { error: error.message }

  revalidatePath('/findings')
  return { success: true }
}

export async function updateFinding(id: string, updates: Partial<AuditFinding>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('audit_findings')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/findings')
  return { success: true }
}

export async function deleteFinding(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('audit_findings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/findings')
  return { success: true }
}

export async function autoGenerateFindings(organizationId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', count: 0 }

  // Fetch all risk data
  const [riskRes, checklistRes] = await Promise.all([
    supabase
      .from('asset_vulnerabilities')
      .select('*, asset:assets(id, name, type), vulnerability:vulnerabilities(id, name, owasp_id, remediation_guidance)')
      .eq('organization_id', organizationId)
      .in('risk_level', ['critical', 'high']),
    supabase
      .from('control_assessments')
      .select('*, control:iso_controls(id, control_id, name, guidance)')
      .eq('organization_id', organizationId)
      .eq('status', 'non_compliant'),
  ])

  const riskItems = riskRes.data || []
  const nonCompliantControls = checklistRes.data || []

  // Get existing auto-generated findings to avoid duplicates
  const { data: existing } = await supabase
    .from('audit_findings')
    .select('vulnerability_id, related_control_id, source')
    .eq('organization_id', organizationId)
    .in('source', ['risk_assessment', 'checklist'])

  const existingVulnIds = new Set((existing || []).map(f => f.vulnerability_id).filter(Boolean))
  const existingControlIds = new Set((existing || []).map(f => f.related_control_id).filter(Boolean))

  const findings: any[] = []

  // Generate from high/critical risks
  for (const item of riskItems) {
    const asset = item.asset as any
    const vuln = item.vulnerability as any
    if (!asset || !vuln) continue
    if (existingVulnIds.has(vuln.id)) continue

    const severityMap: Record<string, FindingSeverity> = {
      critical: 'critical', high: 'high', medium: 'medium', low: 'low'
    }

    findings.push({
      organization_id: organizationId,
      title: `${vuln.name} detected on ${asset.name}`,
      description: `The asset "${asset.name}" (${asset.type}) is exposed to the vulnerability "${vuln.name}" (${vuln.owasp_id}). Risk score: ${item.risk_score}/25 with likelihood ${item.likelihood}/5 and impact ${item.impact}/5.`,
      severity: severityMap[item.risk_level as keyof typeof severityMap] ?? 'medium',
      status: 'open',
      source: 'risk_assessment',
      affected_asset_id: asset.id,
      vulnerability_id: vuln.id,
      risk_level: item.risk_level,
      risk_score: item.risk_score,
      likelihood: item.likelihood,
      impact: item.impact,
      recommendation: vuln.remediation_guidance || 'Review and implement appropriate security controls to mitigate this vulnerability.',
      created_by: user.id,
    })
  }

  // Generate from non-compliant controls
  for (const item of nonCompliantControls) {
    const control = item.control as any
    if (!control) continue
    if (existingControlIds.has(control.id)) continue

    findings.push({
      organization_id: organizationId,
      title: `Non-compliant: ${control.control_id} — ${control.name}`,
      description: `ISO 27001 control ${control.control_id} "${control.name}" has been assessed as Non-Compliant. ${item.notes ? 'Auditor notes: ' + item.notes : ''}`,
      severity: 'high',
      status: 'open',
      source: 'checklist',
      related_control_id: control.id,
      recommendation: control.guidance || 'Implement the required controls as specified in ISO 27001 Annex A.',
      remediation_owner: item.responsible_person || null,
      remediation_deadline: item.target_date || null,
      created_by: user.id,
    })
  }

  if (findings.length === 0) {
    return { success: true, count: 0, message: 'No new findings to generate.' }
  }

  const { error } = await supabase.from('audit_findings').insert(findings)
  if (error) return { error: error.message, count: 0 }

  revalidatePath('/findings')
  return { success: true, count: findings.length }
}

export async function getFindingStats(organizationId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('audit_findings')
    .select('severity, status')
    .eq('organization_id', organizationId)

  const findings = data || []
  return {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    informational: findings.filter(f => f.severity === 'informational').length,
    open: findings.filter(f => f.status === 'open').length,
    in_progress: findings.filter(f => f.status === 'in_progress').length,
    resolved: findings.filter(f => f.status === 'resolved').length,
  }
}
