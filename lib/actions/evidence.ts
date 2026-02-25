'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getEvidenceFiles(organizationId: string, controlId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('evidence_files')
    .select(`
      *,
      control:iso_controls(control_id, name)
    `)
    .eq('organization_id', organizationId)
    .order('uploaded_at', { ascending: false })

  if (controlId) {
    query = query.eq('control_id', controlId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function uploadEvidence(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'No organization found' }

  const file = formData.get('file') as File
  const controlId = formData.get('control_id') as string || null
  const description = formData.get('description') as string || null
  const evidenceType = formData.get('evidence_type') as string || 'document'

  if (!file) return { error: 'No file provided' }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const filePath = `${profile.organization_id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError.message }

  // Save metadata
  const { error: dbError } = await supabase.from('evidence_files').insert({
    organization_id: profile.organization_id,
    control_id: controlId,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    evidence_type: evidenceType as any,
    description,
    uploaded_by: user.id,
  })

  if (dbError) {
    // Cleanup storage on db error
    await supabase.storage.from('evidence').remove([filePath])
    return { error: dbError.message }
  }

  revalidatePath('/evidence')
  return { success: true }
}

export async function deleteEvidence(evidenceId: string, filePath: string) {
  const supabase = createClient()

  // Delete from storage
  await supabase.storage.from('evidence').remove([filePath])

  // Delete from db
  const { error } = await supabase
    .from('evidence_files')
    .delete()
    .eq('id', evidenceId)

  if (error) return { error: error.message }

  revalidatePath('/evidence')
  return { success: true }
}

export async function getEvidenceUrl(filePath: string) {
  const supabase = createClient()
  const { data } = await supabase.storage
    .from('evidence')
    .createSignedUrl(filePath, 3600) // 1 hour expiry
  return data?.signedUrl || null
}
