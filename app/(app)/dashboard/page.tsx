import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Server, AlertTriangle, ShieldAlert, Activity,
  Plus, Clock, ArrowRight, ChevronRight,
  BarChart2, PieChart, Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/actions/organization'
import RiskBadge from '@/components/ui/RiskBadge'
import { formatDate, formatAssetType } from '@/lib/utils'
import { RiskBarChart, AssetDonutChart, SecurityScoreGauge } from '@/components/ui/DashboardCharts'

const STAT_CARDS = [
  { key: 'totalAssets', label: 'Total Assets', icon: Server, href: '/assets', light: 'bg-indigo-50', text: 'text-indigo-600' },
  { key: 'criticalAssets', label: 'Critical Assets', icon: ShieldAlert, href: '/assets', light: 'bg-rose-50', text: 'text-rose-600' },
  { key: 'totalVulnerabilities', label: 'Vulnerabilities', icon: Activity, href: '/risk', light: 'bg-orange-50', text: 'text-orange-600' },
  { key: 'highRisks', label: 'High/Critical Risks', icon: AlertTriangle, href: '/risk', light: 'bg-amber-50', text: 'text-amber-600' },
]

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/organization')

  const orgId = profile.organization_id as string
  const { data: organization } = await supabase
    .from('organizations').select('*').eq('id', orgId).single()
  if (!organization) redirect('/organization')

  const [stats, recentAssets, highRiskItems] = await Promise.all([
    getDashboardStats(orgId),
    supabase.from('assets').select('*').eq('organization_id', orgId).eq('is_active', true).order('created_at', { ascending: false }).limit(5),
    supabase.from('asset_vulnerabilities').select('*, vulnerability:vulnerabilities(*), asset:assets(name, type, id)').eq('organization_id', orgId).in('risk_level', ['critical', 'high']).order('risk_score', { ascending: false }).limit(5),
  ])

  const total = stats.totalVulnerabilities || 1
  const weightedRisk = (stats.highRisks * 2 + (total - stats.highRisks)) / (total * 2)
  const securityScore = Math.max(0, Math.round(100 - weightedRisk * 60 - (stats.criticalAssets / Math.max(stats.totalAssets, 1)) * 20))

  const statValues: Record<string, number> = {
    totalAssets: stats.totalAssets,
    criticalAssets: stats.criticalAssets,
    totalVulnerabilities: stats.totalVulnerabilities,
    highRisks: stats.highRisks,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Welcome back, {profile.full_name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {organization.name} · {new Date().toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/assets/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white/80 text-sm font-semibold transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Add Asset
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, href, light, text }) => (
            <Link key={key} href={href}
              className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${light} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{statValues[key]}</p>
              <p className="text-sm text-slate-400 mt-1 font-medium">{label}</p>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Risk Distribution</h3>
                <p className="text-[10px] text-slate-400">Per level vulnerability</p>
              </div>
            </div>
            <RiskBarChart data={stats.riskDistribution} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Asset by Type</h3>
                <p className="text-[10px] text-slate-400">Komposisi tipe asset</p>
              </div>
            </div>
            <AssetDonutChart data={stats.assetsByType} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Security Score</h3>
                <p className="text-[10px] text-slate-400">Estimasi postur keamanan</p>
              </div>
            </div>
            <SecurityScoreGauge score={securityScore} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Total Vuln', value: stats.totalVulnerabilities, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'High Risk', value: stats.highRisks, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl px-3 py-2 text-center`}>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* High Risk + Recent Assets */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">High Risk Items</h3>
              </div>
              <Link href="/risk" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                 View All<ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-3">
              {highRiskItems.data?.length ? (
                <div className="space-y-1.5">
                  {highRiskItems.data.map((item: any) => (
                    <Link key={item.id} href={`/assets/${item.asset?.id}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">{item.vulnerability?.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.asset?.name} · {formatAssetType(item.asset?.type)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RiskBadge level={item.risk_level} size="sm" />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Tidak ada high-risk findings</p>
                  <p className="text-xs text-slate-400 mt-1">Postur keamananmu terlihat baik!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Recent Assets</h3>
              </div>
              <Link href="/assets" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-3">
              {recentAssets.data?.length ? (
                <div className="space-y-1.5">
                  {recentAssets.data.map((asset: any) => (
                    <Link key={asset.id} href={`/assets/${asset.id}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">{asset.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatAssetType(asset.type)} · Added {formatDate(asset.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RiskBadge level={asset.criticality} size="sm" />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <Server className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Belum ada asset</p>
                  <Link href="/assets/new" className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 inline-block font-medium transition-colors">
                    + Tambah asset pertama
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}