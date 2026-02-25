'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CIASlider from '@/components/ui/CIASlider'
import PageHeader from '@/components/ui/PageHeader'

// Definisi type asset yang valid sesuai skema database
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

export default function EditAssetPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    type: 'software', // Default value
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
    loadAsset()
  }, [id])

  async function loadAsset() {
    const supabase = createClient()
    const { data, error } = await supabase.from('assets').select('*').eq('id', id).single()
    if (error || !data) {
      setError('Asset tidak ditemukan.')
      setLoading(false)
      return
    }
    setForm({
      name: data.name || '',
      description: data.description || '',
      type: (data.type as AssetType) || 'software',
      owner: data.owner || '',
      location: data.location || '',
      ip_address: data.ip_address || '',
      version: data.version || '',
      vendor: data.vendor || '',
      confidentiality: data.confidentiality ?? 3,
      integrity: data.integrity ?? 3,
      availability: data.availability ?? 3,
      notes: data.notes || '',
    })
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()

    // Karena interface FormState sudah sinkron dengan database, kita bisa langsung kirim form
    const { error: err } = await supabase
      .from('assets')
      .update({
        name: form.name,
        description: form.description,
        type: form.type,
        owner: form.owner,
        location: form.location,
        ip_address: form.ip_address,
        version: form.version,
        vendor: form.vendor,
        confidentiality: form.confidentiality,
        integrity: form.integrity,
        availability: form.availability,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push(`/assets/${id}`)
    }, 1000)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()

    // Soft delete — set is_active = false
    const { error: err } = await supabase
      .from('assets')
      .update({ is_active: false, updated_at: new Date().toISOString() } as any)
      .eq('id', id)

    if (err) {
      setError('Gagal menghapus asset: ' + err.message)
      setDeleting(false)
      return
    }

    router.push('/assets')
  }

  // Preview criticality
  const scoreNum = (form.confidentiality * 0.4 + form.integrity * 0.35 + form.availability * 0.25)
  const score = scoreNum.toFixed(2)
  const criticality = scoreNum >= 4 ? 'Critical' : scoreNum >= 3 ? 'High' : scoreNum >= 2 ? 'Medium' : 'Low'
  const critColor = {
    Critical: 'text-red-400',
    High: 'text-orange-400',
    Medium: 'text-yellow-400',
    Low: 'text-green-400',
  }[criticality]

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="glass rounded-xl p-16 text-center border border-white/5 bg-white/5">
          <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm animate-pulse">Memuat data asset...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Edit Asset"
        subtitle="Perbarui informasi dan penilaian risiko asset"
        actions={
          <Link
            href={`/assets/${id}`}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        }
      />

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <Save className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-sm">Asset berhasil diperbarui! Mengalihkan...</p>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="rounded-2xl p-6 w-full max-w-sm border border-slate-700 space-y-4 shadow-2xl" style={{ background: '#0d1424' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Hapus Asset?</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Asset <span className="text-slate-200 font-medium">"{form.name}"</span> akan dihapus dari inventaris. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-60"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Basic Info */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Informasi Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-dark block mb-1.5">Nama Asset *</label>
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
              <label className="label-dark block mb-1.5">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-dark w-full h-20 resize-none"
                placeholder="Deskripsi singkat asset..."
              />
            </div>
          </div>
        </div>

        {/* Asset Type */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Tipe Asset *</h3>
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
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Detail Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark block mb-1.5">Owner / Penanggung Jawab</label>
              <input
                type="text"
                value={form.owner}
                onChange={e => setForm({ ...form, owner: e.target.value })}
                className="input-dark w-full"
                placeholder="IT Department / John Doe"
              />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Lokasi</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input-dark w-full"
                placeholder="Data Center A / Cloud AWS"
              />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Vendor / Manufacturer</label>
              <input
                type="text"
                value={form.vendor}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="input-dark w-full"
                placeholder="Microsoft, AWS, Oracle..."
              />
            </div>
            <div>
              <label className="label-dark block mb-1.5">Versi</label>
              <input
                type="text"
                value={form.version}
                onChange={e => setForm({ ...form, version: e.target.value })}
                className="input-dark w-full"
                placeholder="e.g., 14.0.1, v2.3"
              />
            </div>
            <div className="col-span-2">
              <label className="label-dark block mb-1.5">IP Address</label>
              <input
                type="text"
                value={form.ip_address}
                onChange={e => setForm({ ...form, ip_address: e.target.value })}
                className="input-dark w-full"
                placeholder="192.168.1.100"
              />
            </div>
          </div>
        </div>

        {/* CIA Triad Rating */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">CIA Triad Rating</h3>
            <div className="text-right">
              <p className="text-xs text-slate-600">Criticality Score</p>
              <p className={`text-lg font-bold ${critColor}`}>{score} — {criticality}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-6">Nilai kepentingan setiap atribut keamanan untuk asset ini.</p>
          <div className="space-y-6">
            <CIASlider
              label="Confidentiality (C)"
              name="confidentiality"
              value={form.confidentiality}
              onChange={v => setForm({ ...form, confidentiality: v })}
              description="Seberapa sensitif data asset ini? Apa dampak jika terjadi akses tidak sah?"
            />
            <CIASlider
              label="Integrity (I)"
              name="integrity"
              value={form.integrity}
              onChange={v => setForm({ ...form, integrity: v })}
              description="Seberapa kritis akurasi data? Apa dampak jika data dimodifikasi atau rusak?"
            />
            <CIASlider
              label="Availability (A)"
              name="availability"
              value={form.availability}
              onChange={v => setForm({ ...form, availability: v })}
              description="Seberapa kritis uptime? Apa dampak jika asset tidak tersedia?"
            />
          </div>
          <div className="mt-5 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium mb-2">Formula Score</p>
            <p className="text-xs text-slate-600 font-mono">
              ({form.confidentiality} × 0.4) + ({form.integrity} × 0.35) + ({form.availability} × 0.25) = <span className={`font-bold ${critColor}`}>{score}</span>
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="glass rounded-xl p-6">
          <label className="label-dark block mb-1.5">Catatan Tambahan</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="input-dark w-full h-24 resize-none"
            placeholder="Catatan, dependensi, atau konteks tambahan..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pb-10">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Asset
          </button>

          <div className="flex gap-3">
            <Link
              href={`/assets/${id}`}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving || success}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}