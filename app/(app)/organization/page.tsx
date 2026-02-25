'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Building2, Globe, Users, Mail, Phone, MapPin,
  Server, Shield, AlertCircle, CheckCircle2, Edit3, Save,
  X, Calendar, Wifi, WifiOff,
  Lock, RefreshCw, BadgeCheck, TrendingUp, Camera, Upload, Trash2, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/types/models'

const sectors = [
  { value: 'financial', label: '🏦 Financial Services' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'government', label: '🏛️ Government' },
  { value: 'education', label: '🎓 Education' },
  { value: 'retail', label: '🛒 Retail & E-commerce' },
  { value: 'manufacturing', label: '🏭 Manufacturing' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'telecommunications', label: '📡 Telecommunications' },
  { value: 'other', label: '🔧 Other' },
]

const systemTypeOptions = [
  { id: 'web', label: 'Web Application', icon: '🌐' },
  { id: 'mobile', label: 'Mobile App', icon: '📱' },
  { id: 'cloud', label: 'Cloud Services', icon: '☁️' },
  { id: 'on_premise', label: 'On-Premise', icon: '🖥️' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { id: 'iot', label: 'IoT/OT Systems', icon: '📡' },
  { id: 'api', label: 'APIs/Microservices', icon: '⚡' },
]

const exposureLevels = [
  { value: 'internet_facing', label: 'Internet-Facing', desc: 'Directly accessible from the internet', icon: Wifi, bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', iconColor: 'text-red-500' },
  { value: 'internal', label: 'Internal Only', desc: 'Only accessible within internal network', icon: Lock, bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', iconColor: 'text-blue-500' },
  { value: 'restricted', label: 'Restricted', desc: 'Limited access with strict controls', icon: Shield, bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', iconColor: 'text-orange-500' },
  { value: 'air_gapped', label: 'Air-Gapped', desc: 'Completely isolated from external networks', icon: WifiOff, bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', iconColor: 'text-green-500' },
]

const riskAppetites = [
  { value: 'low', label: 'Low', desc: 'Conservative — Minimize all risks', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  { value: 'medium', label: 'Medium', desc: 'Balanced — Accept calculated risks', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  { value: 'high', label: 'High', desc: 'Aggressive — Accept higher risk for growth', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
]

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800 font-medium break-words">
          {value || <span className="text-slate-400 italic font-normal">Not provided</span>}
        </p>
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, iconBg, children }: {
  title: string; icon: React.ElementType; iconBg: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showViewLogo, setShowViewLogo] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<Partial<Organization>>({
    name: '', description: '', sector: 'technology', employee_count: null,
    website: '', address: '', country: 'Indonesia', contact_name: '',
    contact_email: '', contact_phone: '', system_types: [],
    exposure_level: 'internal', risk_appetite: 'medium', scope_description: '',
    audit_period_start: '', audit_period_end: '', logo_url: '',
  })

  const logoSrc = (org as any)?.logo_url ? `${(org as any).logo_url}?t=${Date.now()}` : null

  useEffect(() => { loadOrg() }, [])

  async function loadOrg() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); setEditing(true); return }
    const { data } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
    if (data) { setOrg(data); setForm(data) }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true); setFeedback(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (org && profile?.organization_id) {
      const { error } = await supabase.from('organizations').update(form).eq('id', org.id)
      if (error) { setFeedback({ type: 'error', msg: error.message }); setSaving(false); return }
      setOrg({ ...org, ...form } as Organization)
    } else {
      const { data: newOrg, error } = await supabase.from('organizations').insert({ ...form, created_by: user.id } as any).select().single()
      if (error) { setFeedback({ type: 'error', msg: error.message }); setSaving(false); return }
      await supabase.from('profiles').update({ organization_id: newOrg.id, role: 'admin' }).eq('id', user.id)
      setOrg(newOrg)
    }
    setSaving(false); setEditing(false)
    setFeedback({ type: 'success', msg: 'Organization profile saved successfully!' })
    setTimeout(() => setFeedback(null), 3500)
  }

  async function handleUploadLogo() {
    if (!logoFile || !org) return
    setUploadingLogo(true)
    const supabase = createClient()
    const ext = logoFile.name.split('.').pop()
    const path = `org-logos/${org.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (uploadError) { setFeedback({ type: 'error', msg: 'Upload failed: ' + uploadError.message }); setUploadingLogo(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('organizations').update({ logo_url: publicUrl } as any).eq('id', org.id)
    setOrg(prev => prev ? { ...prev, logo_url: publicUrl } as any : prev)
    setForm(prev => ({ ...prev, logo_url: publicUrl }))
    setFeedback({ type: 'success', msg: 'Logo updated successfully!' })
    setShowLogoModal(false); setLogoFile(null); setLogoPreview(null)
    setUploadingLogo(false)
    setTimeout(() => setFeedback(null), 3500)
  }

  async function handleRemoveLogo() {
    if (!org) return
    setUploadingLogo(true)
    const supabase = createClient()
    await supabase.from('organizations').update({ logo_url: null } as any).eq('id', org.id)
    setOrg(prev => prev ? { ...prev, logo_url: null } as any : prev)
    setForm(prev => ({ ...prev, logo_url: '' }))
    setLogoPreview(null); setLogoFile(null); setShowLogoModal(false)
    setFeedback({ type: 'success', msg: 'Logo removed.' })
    setUploadingLogo(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setFeedback({ type: 'error', msg: 'File size must be under 2MB.' }); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const toggleSystemType = (type: string) => {
    const current: string[] = form.system_types ?? []
    setForm({ ...form, system_types: current.includes(type) ? current.filter(t => t !== type) : [...current, type] })
  }

  const currentExposure = exposureLevels.find(e => e.value === (org?.exposure_level || form.exposure_level))
  const currentRisk = riskAppetites.find(r => r.value === (org?.risk_appetite || form.risk_appetite))
  const currentSector = sectors.find(s => s.value === (org?.sector || form.sector))

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Organization Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your organization's profile and ISO 27001 audit scope</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white/80 text-sm font-semibold transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {org && (
                <button onClick={() => { setEditing(false); setForm(org) }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all">
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : org ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">
        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm
            ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {feedback.msg}
          </div>
        )}

        {/* Empty state */}
        {!org && !editing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Organization Yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create an organization profile to start your ISO 27001 audit process.</p>
            <button onClick={() => setEditing(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all">
              Create Organization
            </button>
          </div>
        )}

        {/* VIEW MODE */}
        {!editing && org && (
          <div className="space-y-5">
            {/* View Logo Modal (fullscreen) */}
            {showViewLogo && logoSrc && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowViewLogo(false)}>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowViewLogo(false)} className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={logoSrc}
                    alt="Organization Logo"
                    className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
                  />
                  <p className="text-center text-white/50 text-sm mt-3">{org?.name}</p>
                </div>
              </div>
            )}

            {/* Logo Modal */}
            {showLogoModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Edit Organization Logo</h3>
                    <button onClick={() => { setShowLogoModal(false); setLogoPreview(null); setLogoFile(null) }}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    {(logoPreview || (org as any)?.logo_url) ? (
                      <img src={logoPreview || (org as any)?.logo_url} alt="Logo preview"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-5 text-center cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                    <p className="text-sm text-slate-500">{logoFile ? logoFile.name : 'Click to select a logo'}</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, WebP — max 2MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                  <div className="flex gap-2">
                    <button onClick={handleUploadLogo} disabled={!logoFile || uploadingLogo}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-40">
                      {uploadingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {uploadingLogo ? 'Uploading...' : 'Save Logo'}
                    </button>
                    {(org as any)?.logo_url && (
                      <button onClick={handleRemoveLogo} disabled={uploadingLogo}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-6 shadow-sm">
              <div className="relative flex-shrink-0 group">
                <button
                  onClick={() => logoSrc ? setShowViewLogo(true) : setShowLogoModal(true)}
                  className="relative block"
                >
                  {logoSrc ? (
                    <img src={logoSrc} alt="Logo"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 group-hover:border-indigo-300 flex items-center justify-center transition-colors">
                      <Building2 className="w-8 h-8 text-indigo-400" />
                    </div>
                  )}
                  {logoSrc && (
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 border-2 border-white flex items-center justify-center transition-colors shadow-md"
                  title="Change logo"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-800">{org.name}</h2>
                <p className="text-slate-500 text-sm mt-1">{org.description || 'No description provided'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-medium">
                    {currentSector?.label || org.sector}
                  </span>
                  {org.employee_count && (
                    <span className="flex items-center gap-1.5 text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                      <Users className="w-3 h-3" /> {org.employee_count.toLocaleString()} employees
                    </span>
                  )}
                  {org.country && (
                    <span className="flex items-center gap-1.5 text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                      <MapPin className="w-3 h-3" /> {org.country}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Exposure Level', value: currentExposure?.label || '—', icon: currentExposure?.icon || Wifi, bg: 'bg-red-50', iconColor: 'text-red-500', textColor: 'text-red-700' },
                { label: 'Risk Appetite', value: currentRisk?.label || '—', icon: TrendingUp, bg: 'bg-amber-50', iconColor: 'text-amber-500', textColor: 'text-amber-700' },
                { label: 'Audit Start', value: org.audit_period_start ? new Date(org.audit_period_start).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: Calendar, bg: 'bg-purple-50', iconColor: 'text-purple-500', textColor: 'text-purple-700' },
                { label: 'Audit End', value: org.audit_period_end ? new Date(org.audit_period_end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: BadgeCheck, bg: 'bg-cyan-50', iconColor: 'text-cyan-500', textColor: 'text-cyan-700' },
              ].map(({ label, value, icon: Icon, bg, iconColor, textColor }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-semibold ${textColor}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <SectionCard title="Contact Information" icon={Mail} iconBg="bg-blue-50 text-blue-500">
                <InfoRow label="Contact Person" value={org.contact_name} icon={Users} />
                <InfoRow label="Email" value={org.contact_email} icon={Mail} />
                <InfoRow label="Phone" value={org.contact_phone} icon={Phone} />
                <InfoRow label="Website" value={org.website} icon={Globe} />
                <InfoRow label="Address" value={org.address} icon={MapPin} />
              </SectionCard>

              <div className="space-y-5">
                <SectionCard title="System Types in Scope" icon={Server} iconBg="bg-purple-50 text-purple-500">
                  {(org.system_types || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(org.system_types || []).map(t => {
                        const opt = systemTypeOptions.find(o => o.id === t)
                        return opt ? (
                          <span key={t} className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1.5 rounded-lg font-medium">
                            <span>{opt.icon}</span> {opt.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No systems selected</p>
                  )}
                </SectionCard>

                <SectionCard title="Audit Scope" icon={Shield} iconBg="bg-emerald-50 text-emerald-500">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {org.scope_description || <span className="italic text-slate-400">No scope description provided</span>}
                  </p>
                </SectionCard>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {editing && (
          <div className="space-y-5">
            <SectionCard title="Basic Information" icon={Building2} iconBg="bg-indigo-50 text-indigo-500">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                <button onClick={() => setShowLogoModal(true)} className="relative group flex-shrink-0">
                  {(org as any)?.logo_url ? (
                    <img src={(org as any).logo_url} alt="Logo"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border-2 border-indigo-100 group-hover:border-indigo-300 flex items-center justify-center transition-colors">
                      <Building2 className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </button>
                <div>
                  <p className="text-sm font-medium text-slate-700">Organization Logo</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click the logo to upload your organization's icon or photo</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-dark">Organization Name *</label>
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Acme Corporation" />
                </div>
                <div className="col-span-2">
                  <label className="label-dark">Description</label>
                  <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="input-dark h-20 resize-none" placeholder="Brief description of your organization..." />
                </div>
                <div>
                  <label className="label-dark">Business Sector *</label>
                  <select value={form.sector || 'technology'} onChange={e => setForm({ ...form, sector: e.target.value as any })} className="input-dark">
                    {sectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-dark">Number of Employees</label>
                  <input type="number" value={form.employee_count || ''} onChange={e => setForm({ ...form, employee_count: parseInt(e.target.value) || null })} className="input-dark" placeholder="e.g., 500" />
                </div>
                <div>
                  <label className="label-dark">Country</label>
                  <input type="text" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} className="input-dark" placeholder="Indonesia" />
                </div>
                <div>
                  <label className="label-dark">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} className="input-dark pl-10" placeholder="https://company.com" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label-dark">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="input-dark pl-10 h-16 resize-none" placeholder="123 Main Street, Jakarta" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" icon={Mail} iconBg="bg-blue-50 text-blue-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Contact Person</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={form.contact_name || ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="input-dark pl-10" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="label-dark">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="input-dark pl-10" placeholder="security@company.com" />
                  </div>
                </div>
                <div>
                  <label className="label-dark">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="input-dark pl-10" placeholder="+62 21 1234 5678" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="System Types in Scope" icon={Server} iconBg="bg-purple-50 text-purple-500">
              <div className="grid grid-cols-4 gap-2">
                {systemTypeOptions.map(({ id, label, icon }) => {
                  const selected = (form.system_types || []).includes(id)
                  return (
                    <button key={id} type="button" onClick={() => toggleSystemType(id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        selected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      <span>{icon}</span> {label}
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard title="Exposure Level" icon={Wifi} iconBg="bg-orange-50 text-orange-500">
              <div className="grid grid-cols-2 gap-2">
                {exposureLevels.map(({ value, label, desc, icon: Icon, bg, border, text, iconColor }) => {
                  const selected = form.exposure_level === value
                  return (
                    <button key={value} type="button" onClick={() => setForm({ ...form, exposure_level: value as any })}
                      className={`p-3.5 rounded-xl text-left border transition-all ${selected ? `${bg} ${border}` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${selected ? iconColor : 'text-slate-400'}`} />
                        <p className={`text-xs font-semibold ${selected ? text : 'text-slate-600'}`}>{label}</p>
                      </div>
                      <p className="text-[11px] text-slate-400">{desc}</p>
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard title="Risk Appetite" icon={TrendingUp} iconBg="bg-amber-50 text-amber-500">
              <div className="grid grid-cols-3 gap-3">
                {riskAppetites.map(({ value, label, desc, bg, border, text }) => {
                  const selected = form.risk_appetite === value
                  return (
                    <button key={value} type="button" onClick={() => setForm({ ...form, risk_appetite: value as any })}
                      className={`p-4 rounded-xl text-left border transition-all ${selected ? `${bg} ${border}` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <p className={`text-sm font-bold mb-1 ${selected ? text : 'text-slate-700'}`}>{label}</p>
                      <p className="text-[11px] text-slate-400">{desc}</p>
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard title="Audit Period" icon={Calendar} iconBg="bg-cyan-50 text-cyan-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Start Date</label>
                  <input type="date" value={form.audit_period_start || ''} onChange={e => setForm({ ...form, audit_period_start: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="label-dark">End Date</label>
                  <input type="date" value={form.audit_period_end || ''} onChange={e => setForm({ ...form, audit_period_end: e.target.value })} className="input-dark" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Audit Scope Description" icon={Shield} iconBg="bg-emerald-50 text-emerald-500">
              <textarea value={form.scope_description || ''} onChange={e => setForm({ ...form, scope_description: e.target.value })}
                className="input-dark h-32 resize-none"
                placeholder="Describe the scope of this ISO 27001 audit..." />
            </SectionCard>

            <div className="flex justify-end gap-3 pb-4">
              {org && (
                <button onClick={() => { setEditing(false); setForm(org) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all">
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : org ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}