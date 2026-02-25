'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AssetType } from '@/types/database'

export async function getAssets(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getAsset(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      asset_vulnerabilities (
        *,
        vulnerability:vulnerabilities (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createAsset(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'No organization found. Please set up your organization first.' }
  }

  const assetData = {
    organization_id: profile.organization_id,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    type: formData.get('type') as AssetType,
    owner: formData.get('owner') as string || null,
    location: formData.get('location') as string || null,
    ip_address: formData.get('ip_address') as string || null,
    version: formData.get('version') as string || null,
    vendor: formData.get('vendor') as string || null,
    confidentiality: parseInt(formData.get('confidentiality') as string) || 3,
    integrity: parseInt(formData.get('integrity') as string) || 3,
    availability: parseInt(formData.get('availability') as string) || 3,
    notes: formData.get('notes') as string || null,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('assets')
    .insert(assetData)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/assets')
  redirect(`/assets/${data.id}`)
}

export async function updateAsset(id: string, formData: FormData) {
  const supabase = createClient()

  const assetData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    type: formData.get('type') as AssetType,
    owner: formData.get('owner') as string || null,
    location: formData.get('location') as string || null,
    ip_address: formData.get('ip_address') as string || null,
    version: formData.get('version') as string || null,
    vendor: formData.get('vendor') as string || null,
    confidentiality: parseInt(formData.get('confidentiality') as string) || 3,
    integrity: parseInt(formData.get('integrity') as string) || 3,
    availability: parseInt(formData.get('availability') as string) || 3,
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase
    .from('assets')
    .update(assetData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/assets')
  revalidatePath(`/assets/${id}`)
  redirect(`/assets/${id}`)
}

export async function deleteAsset(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('assets')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/assets')
  redirect('/assets')
}

export async function addVulnerabilityToAsset(
  assetId: string,
  vulnerabilityId: string,
  likelihood: number,
  impact: number,
  organizationId: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('asset_vulnerabilities')
    .upsert({
      asset_id: assetId,
      vulnerability_id: vulnerabilityId,
      organization_id: organizationId,
      likelihood,
      impact,
      assessed_by: user.id,
    }, { onConflict: 'asset_id,vulnerability_id' })

  if (error) return { error: error.message }

  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}

export async function removeVulnerabilityFromAsset(assetVulnId: string, assetId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('asset_vulnerabilities')
    .delete()
    .eq('id', assetVulnId)

  if (error) return { error: error.message }

  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}
