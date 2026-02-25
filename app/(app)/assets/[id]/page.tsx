'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Plus, Trash2, AlertTriangle, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import RiskBadge from '@/components/ui/RiskBadge'
import PageHeader from '@/components/ui/PageHeader'
import { formatAssetType, formatDate, getCIALabel, calculateRiskLevel } from '@/lib/utils'

export default function AssetDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  
  // Menggunakan any untuk menghindari error jika file types/database belum siap
  const [asset, setAsset] = useState<any>(null)
  const [vulns, setVulns] = useState<any[]>([])
  const [allVulns, setAllVulns] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [showAddVuln, setShowAddVuln] = useState(false)
  const [selectedVuln, setSelectedVuln] = useState<string>('')
  const [likelihood, setLikelihood] = useState(3)
  const [impact, setImpact] = useState(3)
  const [adding, setAdding] = useState(false)
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const supabase = createClient()
    const [assetRes, vulnRes, allVulnRes] = await Promise.all([
      supabase.from('assets').select('*').eq('id', id).single(),
      supabase.from('asset_vulnerabilities').select('*, vulnerability:vulnerabilities(*)').eq('asset_id', id).order('risk_score', { ascending: false }),
      supabase.from('vulnerabilities').select('*').eq('is_active', true).order('owasp_id'),
    ])
    setAsset(assetRes.data)
    setVulns(vulnRes.data || [])
    setAllVulns(allVulnRes.data || [])
    setLoading(false)
  }

  async function handleAddVuln() {
    if (!selectedVuln) return
    setAdding(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

      // Fix: Menambahkan 'as any' pada payload upsert untuk menghindari error mismatch schema/types
      await supabase.from('asset_vulnerabilities').upsert({
        asset_id: id,
        vulnerability_id: selectedVuln,
        organization_id: profile!.organization_id,
        likelihood,
        impact,
        assessed_by: user!.id,
      } as any, { onConflict: 'asset_id,vulnerability_id' })

      setShowAddVuln(false)
      setSelectedVuln('')
      setLikelihood(3)
      setImpact(3)
      loadData()
    } catch (error) {
      console.error('Error adding vulnerability:', error)
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteVuln(vulnId: string) {
    const supabase = createClient()
    await supabase.from('asset_vulnerabilities').delete().eq('id', vulnId)
    loadData()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!asset) return <div className="p-8 text-slate-500">Asset not found.</div>

  const assignedVulnIds = vulns.map(v => v.vulnerability_id)
  const availableVulns = allVulns.filter(v => !assignedVulnIds.includes(v.id))
  const riskPreview = calculateRiskLevel(likelihood, impact)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title={asset.name}
        subtitle={`${formatAssetType(asset.type)} · Added ${formatDate(asset.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/assets/${id}/edit`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all">
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
            <Link href="/assets" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Asset Info */}
        <div className="col-span-1 space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Asset Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Type', value: formatAssetType(asset.type) },
                { label: 'Owner', value: asset.owner },
                { label: 'Location', value: asset.location },
                { label: 'Vendor', value: asset.vendor },
                { label: 'Version', value: asset.version },
                { label: 'IP Address', value: asset.ip_address },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <p className="text-[11px] text-slate-600">{label}</p>
                  <p className="text-sm text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CIA */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">CIA Triad</h3>
            <div className="space-y-4">
              {[
                { label: 'Confidentiality', key: 'confidentiality', color: 'bg-blue-500', value: asset.confidentiality },
                { label: 'Integrity', key: 'integrity', color: 'bg-purple-500', value: asset.integrity },
                { label: 'Availability', key: 'availability', color: 'bg-cyan-500', value: asset.availability },
              ].map(({ label, color, value }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs text-slate-300 font-medium">{value}/5 · {getCIALabel(value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${value * 20}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Criticality Score</span>
                  <span className="text-sm font-bold text-white">{asset.criticality_score}</span>
                </div>
                <div className="mt-1 flex justify-end">
                 <RiskBadge level={asset.criticality ?? 'medium'} />
                </div>
              </div>
            </div>
          </div>

          {asset.notes && (
            <div className="glass rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Vulnerability Assessment */}
        <div className="col-span-2">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                Vulnerability Assessment
                <span className="ml-1 text-xs bg-slate-800 border border-slate-700 text-slate-500 px-2 py-0.5 rounded-full">{vulns.length}</span>
              </h3>
              <button
                onClick={() => setShowAddVuln(!showAddVuln)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-400 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vulnerability
              </button>
            </div>

            {/* Add vulnerability form */}
            {showAddVuln && (
              <div className="mb-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-semibold text-slate-400">Add OWASP Vulnerability</h4>

                <div>
                  <label className="label-dark block mb-1">Select Vulnerability</label>
                  <select
                    value={selectedVuln}
                    onChange={e => setSelectedVuln(e.target.value)}
                    className="input-dark w-full"
                  >
                    <option value="" className="bg-slate-900">— Select OWASP vulnerability —</option>
                    {availableVulns.map(v => (
                      <option key={v.id} value={v.id} className="bg-slate-900">
                        {v.owasp_id} · {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-dark block mb-1">Likelihood (1–5): {likelihood}</label>
                    <input type="range" min={1} max={5} value={likelihood} onChange={e => setLikelihood(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-700 mt-1">
                      <span>Rare</span><span>Unlikely</span><span>Possible</span><span>Likely</span><span>Almost Certain</span>
                    </div>
                  </div>
                  <div>
                    <label className="label-dark block mb-1">Impact (1–5): {impact}</label>
                    <input type="range" min={1} max={5} value={impact} onChange={e => setImpact(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-700 mt-1">
                      <span>Negligible</span><span>Minor</span><span>Moderate</span><span>Major</span><span>Catastrophic</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Risk Score: {likelihood * impact}</span>
                    <RiskBadge level={riskPreview} size="sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddVuln(false)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-300 transition-colors">Cancel</button>
                    <button
                      onClick={handleAddVuln}
                      disabled={!selectedVuln || adding}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {adding ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {vulns.length > 0 ? (
              <div className="space-y-2">
                {vulns.map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-900/50 border border-slate-800/60 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedVuln(expandedVuln === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <AlertTriangle className={`w-4 h-4 ${
                            item.risk_level === 'critical' ? 'text-red-400' :
                            item.risk_level === 'high' ? 'text-orange-400' :
                            item.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{item.vulnerability?.name}</p>
                          <p className="text-[11px] text-slate-600">{item.vulnerability?.owasp_id} · Category: {item.vulnerability?.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-600">L:{item.likelihood} × I:{item.impact} = <span className="text-slate-400 font-bold">{item.risk_score}</span></p>
                        </div>
                        <RiskBadge level={item.risk_level} size="sm" />
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteVuln(item.id) }}
                          className="p-1 text-slate-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {expandedVuln === item.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </div>
                    </div>

                    {expandedVuln === item.id && (
                      <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{item.vulnerability?.description}</p>
                        {item.vulnerability?.remediation_guidance && (
                          <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/15">
                            <p className="text-[11px] font-semibold text-brand-400 mb-1">Remediation Guidance</p>
                            <p className="text-xs text-slate-400 leading-relaxed">{item.vulnerability?.remediation_guidance}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">No vulnerabilities assessed yet</p>
                <p className="text-xs text-slate-700">Add OWASP vulnerabilities to compute risk scores</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}