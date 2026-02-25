'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CIASlider from '@/components/ui/CIASlider'
import PageHeader from '@/components/ui/PageHeader'

type AssetType = 'hardware' | 'software' | 'data' | 'service' | 'personnel' | 'facility'

const assetTypes: { value: AssetType; label: string; desc: string }[] = [
  { value: 'hardware', label: '🖥️ Hardware', desc: 'Physical devices, servers, workstations' },
  { value: 'software', label: '💿 Software', desc: 'Applications, OS, firmware' },
  { value: 'data', label: '📁 Data', desc: 'Databases, files, documents' },
  { value: 'service', label: '⚡ Service', desc: 'Cloud services, APIs, utilities' },
  { value: 'personnel', label: '👤 Personnel', desc: 'People with system access' },
  { value: 'facility', label: '🏢 Facility', desc: 'Physical locations, data centers' },
]

interface FormState {
  name: string
  description: string
  type: AssetType
  owner: string
  location: string
  ip_address: string
  version: string
  vendor: string
  confidentiality: number
  integrity: number
  availability: number
  notes: string
}

export default function NewAssetPage() {
  const router = useRouter()

  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    type: 'software',
    owner: '',
    location: '',
    ip_address: '',
    version: '',
    vendor: '',
    confidentiality: 3,
    integrity: 3,
    availability: 3,
    notes: '',
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) {
        router.push('/organization')
        return
      }

      setOrgId(profile.organization_id)
      setUserId(user.id)
    }
    loadProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !userId) {
      setError('Organization not found. Please refresh and try again.')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    const { data, error: err } = await supabase
      .from('assets')
      .insert({
        ...form,
        organization_id: orgId,
        created_by: userId,
        is_active: true,
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/assets/${data.id}`), 1000)
  }

  const scoreNum = form.confidentiality * 0.4 + form.integrity * 0.35 + form.availability * 0.25
  const score = scoreNum.toFixed(2)
  const criticality =
    scoreNum >= 4 ? 'Critical' :
    scoreNum >= 3 ? 'High' :
    scoreNum >= 2 ? 'Medium' : 'Low'
  const critColor = { Critical: 'text-red-400', High: 'text-orange-400', Medium: 'text-yellow-400', Low: 'text-green-400' }[criticality]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Add New Asset"
        subtitle="Register a new IT asset and assess its risk"
        actions={
          <Link href="/assets" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <Save className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-sm">Asset created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Basic Info */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Asset Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-dark block mb-1.5">Asset Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="input-dark w-full"
                placeholder="e.g., Main Database Server"
              />
            </div>
            <div className="col-span-2">
              <label className="label-dark block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-dark w-full h-20 resize-none"
                placeholder="Brief asset description..."
              />
            </div>
          </div>
        </div>

        {/* Asset Type */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Asset Type *</h3>
          <div className="grid grid-cols-3 gap-2">
            {assetTypes.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, type: value })}
                className={`p-3 rounded-xl text-left border transition-all ${
                  form.type === value
                    ? 'bg-brand-500/15 border-brand-500/40'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <p className="text-sm mb-0.5">{label}</p>
                <p className="text-[11px] text-slate-600 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Asset Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark block mb-1.5">Owner / Person in Charge</label>
              <input type="text" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="input-dark w-full" placeholder="IT Department / John Doe" />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-dark w-full" placeholder="Data Center A / Cloud AWS" />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Vendor / Manufacturer</label>
              <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="input-dark w-full" placeholder="Microsoft, AWS, Oracle..." />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Version</label>
              <input type="text" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="input-dark w-full" placeholder="e.g., 14.0.1, v2.3" />
            </div>
            <div className="col-span-2">
              <label className="label-dark block mb-1.5">IP Address</label>
              <input type="text" value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} className="input-dark w-full" placeholder="192.168.1.100" />
            </div>
          </div>
        </div>

        {/* CIA Triad */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">CIA Triad Rating</h3>
            <div className="text-right">
              <p className="text-xs text-slate-600">Criticality Score</p>
              <p className={`text-lg font-bold ${critColor}`}>{score} — {criticality}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-6">Rate the importance of each security attribute for this asset.</p>
          <div className="space-y-6">
            <CIASlider label="Confidentiality (C)" name="confidentiality" value={form.confidentiality} onChange={v => setForm({ ...form, confidentiality: v })} description="How sensitive is this asset's data? What is the impact of unauthorized access?" />
            <CIASlider label="Integrity (I)" name="integrity" value={form.integrity} onChange={v => setForm({ ...form, integrity: v })} description="How critical is data accuracy? What is the impact if data is modified or corrupted?" />
            <CIASlider label="Availability (A)" name="availability" value={form.availability} onChange={v => setForm({ ...form, availability: v })} description="How critical is uptime? What is the impact if the asset becomes unavailable?" />
          </div>
          <div className="mt-5 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium mb-2">Score Formula</p>
            <p className="text-xs text-slate-600 font-mono">
              ({form.confidentiality} × 0.4) + ({form.integrity} × 0.35) + ({form.availability} × 0.25) = <span className={`font-bold ${critColor}`}>{score}</span>
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="glass rounded-xl p-6">
          <label className="label-dark block mb-1.5">Additional Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-dark w-full h-24 resize-none" placeholder="Notes, dependencies, or additional context..." />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-10">
          <Link href="/assets" className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || success || !orgId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}