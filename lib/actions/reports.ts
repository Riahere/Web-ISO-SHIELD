'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import type { ReportSnapshot, AuditReport } from '@/types/phase3'

export async function getReports(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('audit_reports')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as AuditReport[]
}

export async function getReport(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('audit_reports')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as AuditReport
}

export async function generateReport(organizationId: string, config: {
  title: string
  auditor_name: string
  audit_date: string
  next_audit_date?: string
  executive_summary?: string
  methodology?: string
  final_opinion: 'certified' | 'conditional' | 'not_certified'
  opinion_notes?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Gather all snapshot data
  const [orgRes, assetsRes, risksRes, findingsRes, complianceRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).single(),
    supabase.from('assets').select('criticality, type').eq('organization_id', organizationId).eq('is_active', true),
    supabase.from('asset_vulnerabilities').select('risk_level').eq('organization_id', organizationId),
    supabase.from('audit_findings').select('severity, status').eq('organization_id', organizationId),
    supabase.from('control_assessments').select('status').eq('organization_id', organizationId),
  ])

  const org = orgRes.data
  const assets = assetsRes.data || []
  const risks = risksRes.data || []
  const findings = findingsRes.data || []
  const assessments = complianceRes.data || []

  // Get total controls
  const { data: totalControlsData } = await supabase.from('iso_controls').select('id')
  const totalControls = totalControlsData?.length || 0

  const compliant = assessments.filter(a => a.status === 'compliant').length
  const partial = assessments.filter(a => a.status === 'partial').length
  const notApplicable = assessments.filter(a => a.status === 'not_applicable').length
  const effective = totalControls - notApplicable
  const complianceScore = effective > 0
    ? Math.round(((compliant + partial * 0.5) / effective) * 100)
    : 0

  // Build asset type breakdown
  const byType: Record<string, number> = {}
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + 1 })

  const snapshot: ReportSnapshot = {
    organization: {
      name: org?.name || '',
      sector: org?.sector || '',
      employee_count: org?.employee_count || null,
      exposure_level: org?.exposure_level || '',
      audit_period_start: org?.audit_period_start || null,
      audit_period_end: org?.audit_period_end || null,
      scope_description: org?.scope_description || null,
    },
    assets: {
      total: assets.length,
      critical: assets.filter(a => a.criticality === 'critical').length,
      high: assets.filter(a => a.criticality === 'high').length,
      medium: assets.filter(a => a.criticality === 'medium').length,
      low: assets.filter(a => a.criticality === 'low').length,
      byType,
    },
    risks: {
      total: risks.length,
      critical: risks.filter(r => r.risk_level === 'critical').length,
      high: risks.filter(r => r.risk_level === 'high').length,
      medium: risks.filter(r => r.risk_level === 'medium').length,
      low: risks.filter(r => r.risk_level === 'low').length,
      negligible: risks.filter(r => r.risk_level === 'negligible').length,
    },
    compliance: {
      score: complianceScore,
      coverage: totalControls > 0 ? Math.round((assessments.length / totalControls) * 100) : 0,
      total: totalControls,
      compliant,
      partial,
      nonCompliant: assessments.filter(a => a.status === 'non_compliant').length,
      notApplicable,
    },
    findings: {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      informational: findings.filter(f => f.severity === 'informational').length,
      open: findings.filter(f => f.status === 'open').length,
      resolved: findings.filter(f => f.status === 'resolved').length,
    },
    generatedAt: new Date().toISOString(),
  }

  const { data: report, error } = await supabase
    .from('audit_reports')
    .insert({
      organization_id: organizationId,
      ...config,
      scope_description: org?.scope_description || null,
      snapshot: snapshot as any, // Cast snapshot ke any agar tidak bentrok dengan tipe Json
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    } as Database['public']['Tables']['audit_reports']['Insert']) // Tambahkan casting di sini
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/report')
  return { success: true, reportId: report.id }
}

export async function updateReport(id: string, updates: Partial<AuditReport>) {
  const supabase = createClient()
  
  // Gunakan 'as any' atau casting ke tipe yang diharapkan Supabase
  const { error } = await supabase
    .from('audit_reports')
    .update(updates as any) 
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/report')
  return { success: true }
}

export async function deleteReport(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('audit_reports').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/report')
  return { success: true }
}
