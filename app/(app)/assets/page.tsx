import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Server, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import RiskBadge from '@/components/ui/RiskBadge'
import { formatAssetType, formatDate } from '@/lib/utils'

const assetTypeIcons: Record<string, string> = {
  hardware: '🖥️',
  software: '💿',
  data: '📁',
  service: '⚡',
  personnel: '👤',
  facility: '🏢',
}

export default async function AssetsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/organization')

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const assetList = assets || []

  const stats = {
    total: assetList.length,
    critical: assetList.filter(a => a.criticality === 'critical').length,
    high: assetList.filter(a => a.criticality === 'high').length,
    medium: assetList.filter(a => a.criticality === 'medium').length,
    low: assetList.filter(a => a.criticality === 'low').length,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Asset Inventory"
        subtitle={`${stats.total} assets tracked · ${stats.critical} critical`}
        actions={
          <Link
            href="/assets/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white/80 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Link>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          { label: 'High', value: stats.high, color: 'text-orange-400' },
          { label: 'Medium', value: stats.medium, color: 'text-yellow-400' },
          { label: 'Low', value: stats.low, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {assetList.length > 0 ? (
        <div className="glass rounded-xl overflow-hidden">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Owner</th>
                <th>CIA Score</th>
                <th>Criticality</th>
                <th>Location</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((asset) => (
                <tr key={asset.id} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{assetTypeIcons[asset.type] || '📦'}</span>
                      <div>
                        <p className="font-medium text-slate-200">{asset.name}</p>
                        {asset.vendor && <p className="text-xs text-slate-600">{asset.vendor}{asset.version ? ` v${asset.version}` : ''}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400">
                      {formatAssetType(asset.type)}
                    </span>
                  </td>
                  <td className="text-slate-400">{asset.owner || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {['C', 'I', 'A'].map((label, i) => {
                          const val = [asset.confidentiality, asset.integrity, asset.availability][i]
                          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500']
                          return (
                            <div key={label} className="flex flex-col items-center gap-0.5">
                              <div className={`w-4 rounded-sm ${colors[i]}`} style={{ height: `${val * 4}px` }} title={`${label}: ${val}`} />
                              <span className="text-[9px] text-slate-700">{label}</span>
                            </div>
                          )
                        })}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{(asset.criticality_score ?? 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <RiskBadge level={asset.criticality ?? 'medium'} />
                  </td>
                  <td className="text-slate-500 text-xs">{asset.location || '—'}</td>
                  <td className="text-slate-600 text-xs">{asset.created_at ? formatDate(asset.created_at) : '—'}</td>
                  <td>
                    <Link
                      href={`/assets/${asset.id}`}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass rounded-xl p-16 text-center">
          <Server className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Assets Yet</h3>
          <p className="text-slate-600 text-sm mb-6">
            Start by adding your first IT asset to begin the risk assessment.
          </p>
          <Link
            href="/assets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add First Asset
          </Link>
        </div>
      )}
    </div>
  )
}
