'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BusinessSector, ExposureLevel } from '@/types/database'

export async function getOrganization() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return null

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  return data
}

export async function createOrganization(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const systemTypes = formData.getAll('system_types') as string[]

  const orgData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    sector: formData.get('sector') as BusinessSector,
    employee_count: formData.get('employee_count') ? parseInt(formData.get('employee_count') as string) : null,
    website: formData.get('website') as string || null,
    address: formData.get('address') as string || null,
    country: formData.get('country') as string || 'Indonesia',
    contact_name: formData.get('contact_name') as string || null,
    contact_email: formData.get('contact_email') as string || null,
    contact_phone: formData.get('contact_phone') as string || null,
    system_types: systemTypes,
    exposure_level: formData.get('exposure_level') as ExposureLevel,
    risk_appetite: (formData.get('risk_appetite') as string) || 'medium',
    scope_description: formData.get('scope_description') as string || null,
    audit_period_start: formData.get('audit_period_start') as string || null,
    audit_period_end: formData.get('audit_period_end') as string || null,
    created_by: user.id,
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .insert(orgData)
    .select()
    .single()

  if (error) return { error: error.message }

  // Link user to organization
  await supabase
    .from('profiles')
    .update({ organization_id: org.id, role: 'admin' })
    .eq('id', user.id)

  revalidatePath('/organization')
  redirect('/dashboard')
}

export async function updateOrganization(id: string, formData: FormData) {
  const supabase = createClient()
  const systemTypes = formData.getAll('system_types') as string[]

  const orgData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    sector: formData.get('sector') as BusinessSector,
    employee_count: formData.get('employee_count') ? parseInt(formData.get('employee_count') as string) : null,
    website: formData.get('website') as string || null,
    address: formData.get('address') as string || null,
    country: formData.get('country') as string || 'Indonesia',
    contact_name: formData.get('contact_name') as string || null,
    contact_email: formData.get('contact_email') as string || null,
    contact_phone: formData.get('contact_phone') as string || null,
    system_types: systemTypes,
    exposure_level: formData.get('exposure_level') as ExposureLevel,
    risk_appetite: (formData.get('risk_appetite') as string) || 'medium',
    scope_description: formData.get('scope_description') as string || null,
    audit_period_start: formData.get('audit_period_start') as string || null,
    audit_period_end: formData.get('audit_period_end') as string || null,
  }

  const { error } = await supabase
    .from('organizations')
    .update(orgData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/organization')
  return { success: true }
}

export async function getDashboardStats(organizationId: string) {
  const supabase = createClient()

  const [assetsResult, vulnsResult] = await Promise.all([
    supabase
      .from('assets')
      .select('id, criticality, type')
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    supabase
      .from('asset_vulnerabilities')
      .select('risk_level')
      .eq('organization_id', organizationId),
  ])

  const assets = assetsResult.data || []
  const vulns = vulnsResult.data || []

  const riskDist = ['critical', 'high', 'medium', 'low', 'negligible'].map(level => ({
    level,
    count: vulns.filter(v => v.risk_level === level).length,
  }))

  const assetTypes = ['hardware', 'software', 'data', 'service', 'personnel', 'facility']
  const assetsByType = assetTypes.map(type => ({
    type,
    count: assets.filter(a => a.type === type).length,
  })).filter(t => t.count > 0)

  return {
    totalAssets: assets.length,
    criticalAssets: assets.filter(a => a.criticality === 'critical').length,
    totalVulnerabilities: vulns.length,
    highRisks: vulns.filter(v => v.risk_level === 'critical' || v.risk_level === 'high').length,
    riskDistribution: riskDist,
    assetsByType,
  }
}
