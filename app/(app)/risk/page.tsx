'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Shield, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import RiskBadge from '@/components/ui/RiskBadge'
import PageHeader from '@/components/ui/PageHeader'
import { formatAssetType } from '@/lib/utils'
import type { Asset, Vulnerability, AssetVulnerability } from '@/types/models'

type RiskItem = AssetVulnerability & { vulnerability: Vulnerability; asset: Asset }

// 5x5 Risk matrix
const MATRIX_LABELS_X = ['Rare (1)', 'Unlikely (2)', 'Possible (3)', 'Likely (4)', 'Certain (5)']
const MATRIX_LABELS_Y = ['Catastrophic (5)', 'Major (4)', 'Moderate (3)', 'Minor (2)', 'Negligible (1)']

function getRiskMatrixCell(likelihood: number, impact: number): string {
  const score = likelihood * impact
  if (score >= 20) return 'bg-red-500/80 border-red-500/50'
  if (score >= 12) return 'bg-orange-500/70 border-orange-500/50'
  if (score >= 6) return 'bg-yellow-500/60 border-yellow-500/50'
  if (score >= 2) return 'bg-green-600/50 border-green-600/50'
  return 'bg-slate-700/50 border-slate-600/50'
}

export default function RiskPage() {
  const [items, setItems] = useState<RiskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    loadRisks()
  }, [])

  async function loadRisks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    const { data } = await supabase
      .from('asset_vulnerabilities')
      .select('*, vulnerability:vulnerabilities(*), asset:assets(*)')
      .eq('organization_id', profile.organization_id)
      .order('risk_score', { ascending: false })

    setItems(data as RiskItem[] || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.risk_level === filter)

  const stats = {
    critical: items.filter(i => i.risk_level === 'critical').length,
    high: items.filter(i => i.risk_level === 'high').length,
    medium: items.filter(i => i.risk_level === 'medium').length,
    low: items.filter(i => i.risk_level === 'low').length,
  }

  // Build matrix data
  const matrixData = Array.from({ length: 5 }, (_, impact) =>
    Array.from({ length: 5 }, (_, likelihood) => {
      const l = likelihood + 1
      const i = 5 - impact
      return items.filter(item => item.likelihood === l && item.impact === i)
    })
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Risk Matrix"
        subtitle={`${items.length} total risk items across ${new Set(items.map(i => i.asset_id)).size} assets`}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Critical', count: stats.critical, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'High', count: stats.high, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Medium', count: stats.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
          { label: 'Low', count: stats.low, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`rounded-xl p-4 text-center border ${bg} ${border}`}>
            <p className={`text-3xl font-bold tabular-nums ${color}`}>{count}</p>
            <p className="text-xs text-slate-600 mt-1">{label} Risk</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Risk Matrix Heatmap */}
        <div className="col-span-3 glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            Risk Heatmap (Likelihood × Impact)
          </h3>

          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              {/* X-axis labels */}
              <div className="flex mb-1 ml-14">
                {MATRIX_LABELS_X.map((label, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[9px] text-slate-600">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {/* Y-axis labels */}
                <div className="flex flex-col gap-1 mr-1 w-12 flex-shrink-0">
                  {MATRIX_LABELS_Y.map((label, i) => (
                    <div key={i} className="h-12 flex items-center justify-end">
                      <span className="text-[8px] text-slate-600 text-right leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Matrix cells */}
                <div className="flex-1">
                  {matrixData.map((row, impactIdx) => (
                    <div key={impactIdx} className="flex gap-1 mb-1">
                      {row.map((cellItems, likelihoodIdx) => (
                        <div
                          key={likelihoodIdx}
                          className={`flex-1 h-12 rounded-lg border flex items-center justify-center transition-all cursor-default ${getRiskMatrixCell(likelihoodIdx + 1, 5 - impactIdx)}`}
                          title={`L:${likelihoodIdx + 1} × I:${5 - impactIdx} = ${(likelihoodIdx + 1) * (5 - impactIdx)}`}
                        >
                          {cellItems.length > 0 && (
                            <span className="text-white text-xs font-bold drop-shadow">{cellItems.length}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 ml-14">
                {[
                  { label: 'Critical (≥20)', color: 'bg-red-500' },
                  { label: 'High (12-19)', color: 'bg-orange-500' },
                  { label: 'Medium (6-11)', color: 'bg-yellow-500' },
                  { label: 'Low (2-5)', color: 'bg-green-600' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                    <span className="text-[10px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Overview by Level */}
        <div className="col-span-2 glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Overview</h3>
          {items.length > 0 ? (
            <div className="space-y-3">
              {['critical', 'high', 'medium', 'low', 'negligible'].map(level => {
                const count = items.filter(i => i.risk_level === level).length
                const pct = items.length ? (count / items.length * 100) : 0
                const colors: Record<string, string> = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500',
                  negligible: 'bg-slate-600',
                }
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-slate-400">{level}</span>
                      <span className="text-slate-300 font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[level]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">No risks yet. Add vulnerabilities to assets.</p>
            </div>
          )}

          {/* Top risks */}
          {items.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-500 mb-3">Top Risk Items</p>
              <div className="space-y-2">
                {items.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40">
                    <RiskBadge level={item.risk_level ?? 'negligible'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300 truncate">{item.vulnerability?.name}</p>
                      <p className="text-[10px] text-slate-600">{(item.asset as any)?.name}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 tabular-nums">{item.risk_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            All Risk Items
          </h3>
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filter === level
                    ? 'bg-brand-600/30 border border-brand-500/40 text-brand-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <table className="table-dark">
            <thead>
              <tr>
                <th>Vulnerability</th>
                <th>Affected Asset</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Risk Score</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <p className="font-medium text-slate-200">{item.vulnerability?.name}</p>
                      <p className="text-xs text-slate-600">{item.vulnerability?.owasp_id}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-slate-300">{(item.asset as any)?.name}</p>
                      <p className="text-xs text-slate-600">{formatAssetType((item.asset as any)?.type)}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-2 h-4 rounded-sm ${i <= item.likelihood ? 'bg-brand-500' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">{item.likelihood}/5</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-2 h-4 rounded-sm ${i <= item.impact ? 'bg-orange-500' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">{item.impact}/5</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-lg font-bold text-white tabular-nums">{item.risk_score}</span>
                    <span className="text-xs text-slate-600 ml-1">/25</span>
                  </td>
                  <td>
                    <RiskBadge level={item.risk_level ?? 'negligible'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {filter === 'all' ? 'No risk assessments yet. Add vulnerabilities to assets.' : `No ${filter} risk items.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
