'use client'

import { useState, useEffect } from 'react'
import { PieChart, TrendingUp, Award, Target, CheckCircle2, AlertCircle, XCircle, MinusCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import CircularProgress from '@/components/ui/CircularProgress'
import type { ComplianceStats } from '@/types/phase2'

const MATURITY_LEVELS = [
  { min: 0,  max: 20,  label: 'Initial',    desc: 'Ad hoc, unpredictable processes', color: '#ef4444' },
  { min: 20, max: 40,  label: 'Developing', desc: 'Basic controls being established', color: '#f97316' },
  { min: 40, max: 60,  label: 'Defined',    desc: 'Documented and standardized', color: '#f59e0b' },
  { min: 60, max: 80,  label: 'Managed',    desc: 'Measured and controlled', color: '#84cc16' },
  { min: 80, max: 101, label: 'Optimizing', desc: 'Continuous improvement', color: '#10b981' },
]

function getMaturity(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score < l.max) || MATURITY_LEVELS[0]
}

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    // Get all domains with controls
    const { data: domainsData } = await supabase
      .from('iso_domains')
      .select(`*, iso_controls(id, domain_id, control_assessments(status, organization_id))`)
      .order('sort_order')

    if (!domainsData) { setLoading(false); return }

    let totalControls = 0
    let assessed = 0, compliant = 0, partial = 0, nonCompliant = 0, notApplicable = 0

    const domainStats = domainsData.map((domain: any) => {
      const controls = domain.iso_controls || []
      const orgAssessments = controls.map((c: any) =>
        (c.control_assessments || []).find((a: any) => a.organization_id === profile.organization_id)
      )

      const dc = orgAssessments.filter((a: any) => a?.status === 'compliant').length
      const dp = orgAssessments.filter((a: any) => a?.status === 'partial').length
      const dnc = orgAssessments.filter((a: any) => a?.status === 'non_compliant').length
      const dna = orgAssessments.filter((a: any) => a?.status === 'not_applicable').length
      const dAssessed = orgAssessments.filter(Boolean).length
      const dEffective = controls.length - dna
      const dScore = dEffective > 0 ? Math.round(((dc + dp * 0.5) / dEffective) * 100) : 0

      totalControls += controls.length
      assessed += dAssessed
      compliant += dc
      partial += dp
      nonCompliant += dnc
      notApplicable += dna

      return {
        ...domain,
        assessed: dAssessed,
        compliant: dc,
        partial: dp,
        non_compliant: dnc,
        not_applicable: dna,
        score: dScore,
        control_count: controls.length,
      }
    })

    const effective = totalControls - notApplicable
    const complianceScore = effective > 0
      ? Math.round(((compliant + partial * 0.5) / effective) * 100) : 0

    setStats({
      totalControls,
      assessed,
      compliant,
      partial,
      nonCompliant,
      notApplicable,
      complianceScore,
      coverage: totalControls > 0 ? Math.round((assessed / totalControls) * 100) : 0,
      domainStats,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Set up your organization to view compliance data.</p>
        <Link href="/organization" className="mt-3 inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm transition-colors">
          Set up Organization <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  const maturity = getMaturity(stats.complianceScore)
  const scoreColor = stats.complianceScore >= 80 ? '#10b981' : stats.complianceScore >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Compliance Dashboard"
        subtitle="ISO 27001 Annex A compliance posture overview"
        actions={
          <Link href="/checklist" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all">
            Update Checklist <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-5 mb-6">

        <div className="col-span-3 glass rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <CircularProgress
            value={stats.complianceScore}
            size={140}
            strokeWidth={10}
            color={scoreColor}
            label={`${stats.complianceScore}%`}
            sublabel="Compliant"
          />
          <p className="text-lg font-bold text-white mt-4">Overall Score</p>
          <p className="text-xs text-slate-500 mt-1">{stats.coverage}% controls assessed</p>
        </div>

        <div className="col-span-3 glass rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-brand-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maturity Level</p>
            </div>
            <p className="text-3xl font-bold mt-3" style={{ color: maturity.color }}>{maturity.label}</p>
            <p className="text-sm text-slate-500 mt-1 leading-snug">{maturity.desc}</p>
          </div>

          <div className="mt-5 space-y-1.5">
            {MATURITY_LEVELS.map((level, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ backgroundColor: level.label === maturity.label ? maturity.color : '#334155' }}
                />
                <span className={`text-xs ${level.label === maturity.label ? 'font-semibold' : 'text-slate-600'}`}
                  style={{ color: level.label === maturity.label ? maturity.color : undefined }}>
                  {level.label}
                </span>
                {level.label === maturity.label && (
                  <span className="ml-auto text-[10px] text-slate-600">← Current</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-6 glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-brand-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Control Status Breakdown</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Compliant', value: stats.compliant, color: '#10b981', bg: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
              { label: 'Partial', value: stats.partial, color: '#f59e0b', bg: 'bg-yellow-500', icon: AlertCircle, iconColor: 'text-yellow-400' },
              { label: 'Non-Compliant', value: stats.nonCompliant, color: '#ef4444', bg: 'bg-red-500', icon: XCircle, iconColor: 'text-red-400' },
              { label: 'Not Applicable', value: stats.notApplicable, color: '#475569', bg: 'bg-slate-600', icon: MinusCircle, iconColor: 'text-slate-500' },
            ].map(({ label, value, bg, icon: Icon, iconColor }) => {
              const pct = stats.totalControls > 0 ? (value / stats.totalControls) * 100 : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                      <span className="text-sm text-slate-400">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
                      <span className="text-xs text-slate-600 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${bg} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-white tabular-nums">{stats.totalControls}</p>
              <p className="text-xs text-slate-600">Total Controls</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white tabular-nums">{stats.assessed}</p>
              <p className="text-xs text-slate-600">Assessed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white tabular-nums">{stats.totalControls - stats.assessed}</p>
              <p className="text-xs text-slate-600">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-300">Compliance by Domain</h3>
        </div>

        <div className="divide-y divide-slate-800/60">
          {stats.domainStats.map(domain => {
            const total = domain.control_count
            const cPct = total > 0 ? (domain.compliant / total) * 100 : 0
            const pPct = total > 0 ? (domain.partial / total) * 100 : 0
            const ncPct = total > 0 ? (domain.non_compliant / total) * 100 : 0
            const scoreColor = domain.score >= 80 ? 'text-emerald-400' : domain.score >= 50 ? 'text-yellow-400' : 'text-red-400'

            return (
              <div key={domain.id} className="flex items-center gap-5 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                <div className="w-8 flex-shrink-0">
                  <span className="text-xs font-mono text-brand-400/70">{domain.code}</span>
                </div>
                <div className="w-56 flex-shrink-0">
                  <p className="text-sm text-slate-300 leading-snug">{domain.name}</p>
                  <p className="text-[11px] text-slate-600">{domain.assessed}/{total} assessed</p>
                </div>

                <div className="flex-1">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${cPct}%` }} />
                    <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${pPct}%` }} />
                    <div className="bg-red-500/70 h-full transition-all duration-500" style={{ width: `${ncPct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <span className="text-emerald-400 tabular-nums w-4 text-center">{domain.compliant}</span>
                  <span className="text-yellow-400 tabular-nums w-4 text-center">{domain.partial}</span>
                  <span className="text-red-400 tabular-nums w-4 text-center">{domain.non_compliant}</span>
                  <span className="text-slate-600 tabular-nums w-4 text-center">{domain.not_applicable}</span>
                </div>

                <div className={`w-12 text-right text-sm font-bold tabular-nums flex-shrink-0 ${scoreColor}`}>
                  {domain.score}%
                </div>

                <Link href="/checklist" className="text-xs text-slate-700 hover:text-brand-400 transition-colors flex-shrink-0">
                  →
                </Link>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center gap-5 justify-end">
          {[
            { color: 'bg-emerald-500', label: 'Compliant' },
            { color: 'bg-yellow-500', label: 'Partial' },
            { color: 'bg-red-500/70', label: 'Non-Compliant' },
            { color: 'bg-slate-600', label: 'N/A' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Recommended Next Steps</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: XCircle,
              color: 'text-red-400',
              bg: 'bg-red-500/10 border-red-500/20',
              title: `${stats.nonCompliant} Non-Compliant Controls`,
              desc: 'Prioritize addressing critical non-compliant controls to reduce audit risk.',
              action: 'View in Checklist',
              href: '/checklist',
            },
            {
              icon: AlertCircle,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10 border-yellow-500/20',
              title: `${stats.totalControls - stats.assessed} Unassessed Controls`,
              desc: 'Complete the remaining assessments to get full compliance visibility.',
              action: 'Continue Assessment',
              href: '/checklist',
            },
            {
              icon: CheckCircle2,
              color: 'text-brand-400',
              bg: 'bg-brand-500/10 border-brand-500/20',
              title: 'Upload Evidence',
              desc: 'Support your compliant controls with documentation and evidence files.',
              action: 'Go to Evidence',
              href: '/evidence',
            },
          ].map(({ icon: Icon, color, bg, title, desc, action, href }) => (
            <div key={title} className={`p-4 rounded-xl border ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{desc}</p>
              <Link href={href} className={`text-xs font-medium ${color} hover:opacity-80 transition-opacity flex items-center gap-1`}>
                {action} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
