'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertCircle, MinusCircle, FileText, Search, Filter, RefreshCw, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { upsertControlAssessment } from '@/lib/actions/checklist'
import StatusBadge from '@/components/ui/StatusBadge'
import PageHeader from '@/components/ui/PageHeader'
import type { DomainWithControls, control_status } from '@/types/phase2'

const statusOptions: { value: control_status; label: string; icon: any; color: string }[] = [
  { value: 'compliant', label: 'Compliant', icon: CheckCircle2, color: 'text-emerald-400 hover:bg-emerald-500/10' },
  { value: 'partial', label: 'Partial', icon: AlertCircle, color: 'text-yellow-400 hover:bg-yellow-500/10' },
  { value: 'non_compliant', label: 'Non-Compliant', icon: XCircle, color: 'text-red-400 hover:bg-red-500/10' },
  { value: 'not_applicable', label: 'N/A', icon: MinusCircle, color: 'text-slate-500 hover:bg-slate-500/10' },
]

interface EditDrawerProps {
  control: any
  orgId: string
  onClose: () => void
  onSaved: () => void
}

function EditDrawer({ control, orgId, onClose, onSaved }: EditDrawerProps) {
  const [form, setForm] = useState({
    status: control.assessment?.status || 'non_compliant' as control_status,
    notes: control.assessment?.notes || '',
    implementation_details: control.assessment?.implementation_details || '',
    responsible_person: control.assessment?.responsible_person || '',
    target_date: control.assessment?.target_date || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await upsertControlAssessment(
      orgId, control.id, form.status,
      form.notes, form.implementation_details,
      form.responsible_person, form.target_date
    )
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] bg-[#0d1424] border-l border-slate-800 h-full overflow-y-auto flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
                {control.control_id}
              </span>
              <h3 className="text-base font-semibold text-white mt-2 leading-snug">{control.name}</h3>
            </div>
            <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Description */}
          {control.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Control Objective</p>
              <p className="text-sm text-slate-400 leading-relaxed">{control.description}</p>
            </div>
          )}

          {/* Guidance */}
          {control.guidance && (
            <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
              <p className="text-xs font-semibold text-brand-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Implementation Guidance
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{control.guidance}</p>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Compliance Status</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setForm({ ...form, status: value })}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    form.status === value
                      ? value === 'compliant' ? 'bg-emerald-500/15 border-emerald-500/40'
                        : value === 'partial' ? 'bg-yellow-500/15 border-yellow-500/40'
                        : value === 'non_compliant' ? 'bg-red-500/15 border-red-500/40'
                        : 'bg-slate-700/30 border-slate-600/40'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${form.status === value ? color.split(' ')[0] : 'text-slate-600'}`} />
                  <span className={`text-xs font-medium ${form.status === value ? 'text-slate-200' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-dark">Assessment Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="input-dark h-24 resize-none"
              placeholder="Describe the current state of compliance, gaps found, evidence reviewed..."
            />
          </div>

          {/* Implementation Details */}
          <div>
            <label className="label-dark">Implementation Details</label>
            <textarea
              value={form.implementation_details}
              onChange={e => setForm({ ...form, implementation_details: e.target.value })}
              className="input-dark h-20 resize-none"
              placeholder="What controls or processes are in place to address this requirement?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark">Responsible Person</label>
              <input
                type="text"
                value={form.responsible_person}
                onChange={e => setForm({ ...form, responsible_person: e.target.value })}
                className="input-dark"
                placeholder="e.g., IT Manager"
              />
            </div>
            <div>
              <label className="label-dark">Target Date</label>
              <input
                type="date"
                value={form.target_date}
                onChange={e => setForm({ ...form, target_date: e.target.value })}
                className="input-dark"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all border border-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChecklistPage() {
  const [domains, setDomains] = useState<DomainWithControls[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [editingControl, setEditingControl] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [quickSaving, setQuickSaving] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    const { data: domainsData } = await supabase
      .from('iso_domains')
      .select(`*, iso_controls(*, control_assessments(*))`)
      .order('sort_order')

    if (!domainsData) { setLoading(false); return }

    const processed = domainsData.map((domain: any) => ({
      ...domain,
      iso_controls: (domain.iso_controls || []).map((control: any) => ({
        ...control,
        assessment: (control.control_assessments || []).find(
          (a: any) => a.organization_id === profile.organization_id
        ) || null,
      })).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))

    setDomains(processed)
    // Expand first domain by default
    if (processed.length > 0) setExpandedDomains(new Set([processed[0].id]))
    setLoading(false)
  }, [])

  async function handleQuickStatus(control: any, status: control_status) {
    if (!orgId) return
    setQuickSaving(control.id)
    await upsertControlAssessment(orgId, control.id, status)
    setQuickSaving(null)
    loadData()
  }

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Overall stats
  const allControls = domains.flatMap(d => d.iso_controls)
  const stats = {
    total: allControls.length,
    assessed: allControls.filter(c => c.assessment).length,
    compliant: allControls.filter(c => c.assessment?.status === 'compliant').length,
    partial: allControls.filter(c => c.assessment?.status === 'partial').length,
    nonCompliant: allControls.filter(c => c.assessment?.status === 'non_compliant').length,
    na: allControls.filter(c => c.assessment?.status === 'not_applicable').length,
  }
  const effective = stats.total - stats.na
  const score = effective > 0 ? Math.round(((stats.compliant + stats.partial * 0.5) / effective) * 100) : 0
  const coverage = stats.total > 0 ? Math.round((stats.assessed / stats.total) * 100) : 0

  // Filter
  const filteredDomains = domains.map(domain => ({
    ...domain,
    iso_controls: domain.iso_controls.filter(control => {
      const matchSearch = !search ||
        control.name.toLowerCase().includes(search.toLowerCase()) ||
        control.control_id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'unassessed' && !control.assessment) ||
        (control.assessment?.status === statusFilter)
      return matchSearch && matchStatus
    })
  })).filter(d => d.iso_controls.length > 0)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="ISO 27001 Control Checklist"
        subtitle="Annex A — 14 domains across all mandatory and optional controls"
        actions={
          <button onClick={loadData} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Progress summary */}
      <div className="grid grid-cols-6 gap-3 mb-8">
        <div className="col-span-2 glass rounded-xl p-5 flex items-center gap-5">
          {/* Arc progress */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="-rotate-90 w-20 h-20">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1e2a44" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{score}%</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{score}% Compliant</p>
            <p className="text-xs text-slate-500">{coverage}% coverage · {stats.assessed}/{stats.total} assessed</p>
          </div>
        </div>

        {[
          { label: 'Compliant', value: stats.compliant, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Partial', value: stats.partial, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Non-Compliant', value: stats.nonCompliant, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Not Applicable', value: stats.na, color: 'text-slate-500', bg: 'bg-slate-700/20 border-slate-700/40' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 text-center border ${bg}`}>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-xs text-slate-600 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-dark pl-10 w-full"
            placeholder="Search controls by name or ID..."
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'unassessed', 'compliant', 'partial', 'non_compliant', 'not_applicable'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === f
                  ? 'bg-brand-600/25 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unassessed' ? 'Unassessed' : f === 'non_compliant' ? 'Non-Compliant' : f === 'not_applicable' ? 'N/A' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Domain Accordion */}
      <div className="space-y-2">
        {filteredDomains.map(domain => {
          const isExpanded = expandedDomains.has(domain.id)
          const domainControls = domain.iso_controls
          const domainCompliant = domainControls.filter(c => c.assessment?.status === 'compliant').length
          const domainPartial = domainControls.filter(c => c.assessment?.status === 'partial').length
          const domainNA = domainControls.filter(c => c.assessment?.status === 'not_applicable').length
          const domainEffective = domainControls.length - domainNA
          const domainScore = domainEffective > 0
            ? Math.round(((domainCompliant + domainPartial * 0.5) / domainEffective) * 100) : 0

          return (
            <div key={domain.id} className="glass rounded-xl overflow-hidden">
              {/* Domain header */}
              <button
                onClick={() => toggleDomain(domain.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-400">{domain.code}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200">{domain.name}</p>
                    {domainCompliant === domainEffective && domainEffective > 0 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{domainControls.length} controls</p>
                </div>

                {/* Domain mini-bar */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    {domainControls.length > 0 && (
                      <>
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(domainCompliant / domainControls.length) * 100}%` }} />
                          <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(domainPartial / domainControls.length) * 100}%` }} />
                          <div className="bg-red-500/70 h-full transition-all" style={{ width: `${(domainControls.filter(c => c.assessment?.status === 'non_compliant').length / domainControls.length) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${domainScore >= 80 ? 'text-emerald-400' : domainScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {domainScore}%
                        </span>
                      </>
                    )}
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  }
                </div>
              </button>

              {/* Controls list */}
              {isExpanded && (
                <div className="border-t border-slate-800/60">
                  {domainControls.map((control, idx) => (
                    <div
                      key={control.id}
                      className={`flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.015] transition-colors group ${idx !== domainControls.length - 1 ? 'border-b border-slate-800/40' : ''}`}
                    >
                      {/* Control ID */}
                      <code className="text-xs text-brand-400/70 w-20 flex-shrink-0 font-mono">{control.control_id}</code>

                      {/* Name */}
                      <button
                        onClick={() => setEditingControl(control)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm text-slate-300 hover:text-white transition-colors truncate">
                          {control.name}
                          {control.is_mandatory && (
                            <span className="ml-2 text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-medium">Required</span>
                          )}
                        </p>
                        {control.assessment?.notes && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">{control.assessment.notes}</p>
                        )}
                      </button>

                      {/* Quick status buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {statusOptions.map(({ value, icon: Icon, color }) => (
                          <button
                            key={value}
                            onClick={() => handleQuickStatus(control, value)}
                            disabled={quickSaving === control.id}
                            className={`p-1.5 rounded-lg transition-all ${color} ${control.assessment?.status === value ? 'bg-current/10' : ''}`}
                            title={value.replace('_', ' ')}
                          >
                            {quickSaving === control.id
                              ? <div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />
                              : <Icon className="w-3.5 h-3.5" />
                            }
                          </button>
                        ))}
                      </div>

                      {/* Status badge */}
                      <div className="w-28 flex-shrink-0 flex justify-end">
                        {control.assessment ? (
                          <StatusBadge status={control.assessment.status} size="sm" showIcon />
                        ) : (
                          <span className="text-xs text-slate-700 italic">unassessed</span>
                        )}
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => setEditingControl(control)}
                        className="text-xs text-slate-600 hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        Edit →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredDomains.length === 0 && (
        <div className="glass rounded-xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No controls match your search/filter.</p>
        </div>
      )}

      {/* Edit drawer */}
      {editingControl && orgId && (
        <EditDrawer
          control={editingControl}
          orgId={orgId}
          onClose={() => setEditingControl(null)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
