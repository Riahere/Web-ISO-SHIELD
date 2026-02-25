'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { control_status } from '@/types/phase2'

export async function getDomainsWithControls(organizationId: string) {
  const supabase = createClient()

  const { data: domains } = await supabase
    .from('iso_domains')
    .select(`
      *,
      iso_controls (
        *,
        control_assessments (
          *
        )
      )
    `)
    .order('sort_order')

  if (!domains) return []

  // Filter assessments to only this org
  return domains.map(domain => ({
    ...domain,
    iso_controls: (domain.iso_controls || []).map((control: any) => ({
      ...control,
      assessment: (control.control_assessments || []).find(
        (a: any) => a.organization_id === organizationId
      ) || null,
    })),
  }))
}

export async function upsertControlAssessment(
  organizationId: string,
  controlId: string,
  status: control_status,
  notes?: string,
  implementationDetails?: string,
  responsiblePerson?: string,
  targetDate?: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('control_assessments')
    .upsert({
      organization_id: organizationId,
      control_id: controlId,
      status,
      notes: notes || null,
      implementation_details: implementationDetails || null,
      responsible_person: responsiblePerson || null,
      target_date: targetDate || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      created_by: user.id,
    }, { onConflict: 'organization_id,control_id' })

  if (error) return { error: error.message }

  revalidatePath('/checklist')
  revalidatePath('/compliance')
  return { success: true }
}

export async function getComplianceStats(organizationId: string) {
  const supabase = createClient()

  const [assessmentsRes, totalControlsRes, domainsRes] = await Promise.all([
    supabase
      .from('control_assessments')
      .select('status, control_id')
      .eq('organization_id', organizationId),
    supabase
      .from('iso_controls')
      .select('id, domain_id'),
    supabase
      .from('iso_domains')
      .select('id, code, name, control_count')
      .order('sort_order'),
  ])

  const assessments = assessmentsRes.data || []
  const totalControls = totalControlsRes.data?.length || 0
  const domains = domainsRes.data || []

  const assessed = assessments.length
  const compliant = assessments.filter(a => a.status === 'compliant').length
  const partial = assessments.filter(a => a.status === 'partial').length
  const nonCompliant = assessments.filter(a => a.status === 'non_compliant').length
  const notApplicable = assessments.filter(a => a.status === 'not_applicable').length

  // Effective total = total - not applicable
  const effectiveTotal = totalControls - notApplicable
  const complianceScore = effectiveTotal > 0
    ? Math.round(((compliant + partial * 0.5) / effectiveTotal) * 100)
    : 0

  // Per domain stats
  const domainStats = domains.map(domain => {
    const domainControlIds = (totalControlsRes.data || [])
      .filter(c => c.domain_id === domain.id)
      .map(c => c.id)

    const domainAssessments = assessments.filter(a => domainControlIds.includes(a.control_id))
    const domainCompliant = domainAssessments.filter(a => a.status === 'compliant').length
    const domainPartial = domainAssessments.filter(a => a.status === 'partial').length
    const domainNA = domainAssessments.filter(a => a.status === 'not_applicable').length
    const domainEffective = (domain.control_count ?? 0) - domainNA
    const domainScore = domainEffective > 0
      ? Math.round(((domainCompliant + domainPartial * 0.5) / domainEffective) * 100)
      : 0

    return {
      ...domain,
      assessed: domainAssessments.length,
      compliant: domainCompliant,
      partial: domainPartial,
      non_compliant: domainAssessments.filter(a => a.status === 'non_compliant').length,
      not_applicable: domainNA,
      score: domainScore,
    }
  })

  return {
    totalControls,
    assessed,
    compliant,
    partial,
    nonCompliant,
    notApplicable,
    complianceScore,
    coverage: totalControls > 0 ? Math.round((assessed / totalControls) * 100) : 0,
    domainStats,
  }
}
