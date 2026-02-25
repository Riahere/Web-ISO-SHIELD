'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText, Download, Plus, ChevronRight, Shield,
  CheckCircle2, AlertCircle, AlertTriangle, Printer,
  Eye, Trash2, X, Save, TrendingUp, BarChart3, Award
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateReport, deleteReport } from '@/lib/actions/reports'
import PageHeader from '@/components/ui/PageHeader'
import type { AuditReport, ReportSnapshot } from '@/types/phase3'
import { formatDate, formatSector, formatExposureLevel } from '@/lib/utils'

/* ── CONFIG ───────────────────────────────────────────────────────────────── */

const opinionConfig = {
  certified:     { label: 'Certified',     color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', barColor: '#10b981', icon: CheckCircle2 },
  conditional:   { label: 'Conditional',   color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30',  barColor: '#eab308', icon: AlertCircle },
  not_certified: { label: 'Not Certified', color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     barColor: '#ef4444', icon: AlertTriangle },
}

/* ── PRINT PREVIEW ────────────────────────────────────────────────────────── */

function ReportPreview({ report, findings }: { report: AuditReport; findings: any[] }) {
  const snap = report.snapshot as ReportSnapshot
  const opinion = report.final_opinion ? opinionConfig[report.final_opinion] : null
  const OpinionIcon = opinion?.icon ?? null

  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 }
  const sorted = [...findings].sort((a, b) => (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5))

  const sevColors: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', informational: '#3b82f6'
  }

  return (
    <div id="report-printable" style={{ fontFamily: "'Georgia', serif", color: '#0f172a', lineHeight: 1.6, fontSize: '13px' }}>
      {/* ── COVER PAGE ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', minHeight: '100vh', padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pageBreakAfter: 'always' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#818cf8" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>ISO Shield</span>
        </div>

        <div>
          <p style={{ color: '#818cf8', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>ISO 27001 Security Audit Report</p>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: 'white' }}>{report.title}</h1>
          <div style={{ width: 60, height: 4, background: '#6366f1', borderRadius: 2, marginBottom: 40 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              ['Organization', snap?.organization?.name || '—'],
              ['Sector', snap?.organization?.sector ? formatSector(snap.organization.sector) : '—'],
              ['Audit Date', report.audit_date ? formatDate(report.audit_date) : '—'],
              ['Auditor', report.auditor_name || '—'],
              ['Version', `v${report.version}`],
              ['Next Audit', report.next_audit_date ? formatDate(report.next_audit_date) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>{label}</p>
                <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {opinion && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1.5px solid ${opinion.barColor}`, borderRadius: 24, padding: '8px 20px', color: opinion.barColor }}>
            {OpinionIcon && <OpinionIcon size={16} />}
            <span style={{ fontWeight: 600, fontSize: 13 }}>Final Opinion: {opinion.label}</span>
          </div>
        )}
      </div>

      {/* ── REPORT BODY ── */}
      <div style={{ padding: '48px 64px', background: 'white' }}>

        {/* 1. Executive Summary */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>1. Executive Summary</h2>
          <p style={{ color: '#374151', lineHeight: 1.8 }}>{report.executive_summary || 'No executive summary provided.'}</p>

          {snap && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
              {[
                { label: 'Total Assets', value: snap.assets.total, sub: `${snap.assets.critical} critical` },
                { label: 'Risk Items', value: snap.risks.total, sub: `${snap.risks.critical + snap.risks.high} critical/high` },
                { label: 'Compliance', value: `${snap.compliance.score}%`, sub: `${snap.compliance.coverage}% assessed`, color: snap.compliance.score >= 80 ? '#10b981' : snap.compliance.score >= 50 ? '#f59e0b' : '#ef4444' },
                { label: 'Findings', value: snap.findings.total, sub: `${snap.findings.open} open` },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: color || '#0f172a', marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. Scope */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>2. Scope</h2>
          {snap?.organization && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                {[
                  ['Organization', snap.organization.name],
                  ['Sector', formatSector(snap.organization.sector)],
                  ['Employees', snap.organization.employee_count?.toString() || '—'],
                  ['Exposure Level', formatExposureLevel(snap.organization.exposure_level)],
                  ['Audit Period Start', snap.organization.audit_period_start ? formatDate(snap.organization.audit_period_start) : '—'],
                  ['Audit Period End', snap.organization.audit_period_end ? formatDate(snap.organization.audit_period_end) : '—'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 16px 8px 0', color: '#64748b', fontWeight: 600, width: 180, fontSize: 12 }}>{k}</td>
                    <td style={{ padding: '8px 0', color: '#0f172a', fontSize: 13 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {snap?.organization?.scope_description && <p style={{ color: '#374151', background: '#f8fafc', padding: 16, borderRadius: 8, borderLeft: '3px solid #6366f1' }}>{snap.organization.scope_description}</p>}
        </section>

        {/* 3. Methodology */}
        {report.methodology && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>3. Methodology</h2>
            <p style={{ color: '#374151', lineHeight: 1.8 }}>{report.methodology}</p>
          </section>
        )}

        {/* 4. Risk Assessment */}
        {snap && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>4. Risk Assessment Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {[
                { title: `Asset Inventory (${snap.assets.total})`, items: [
                  ['Critical', snap.assets.critical, '#ef4444'],
                  ['High', snap.assets.high, '#f97316'],
                  ['Medium', snap.assets.medium, '#eab308'],
                  ['Low', snap.assets.low, '#22c55e'],
                ], total: snap.assets.total },
                { title: `Risk Distribution (${snap.risks.total})`, items: [
                  ['Critical', snap.risks.critical, '#ef4444'],
                  ['High', snap.risks.high, '#f97316'],
                  ['Medium', snap.risks.medium, '#eab308'],
                  ['Low', snap.risks.low, '#22c55e'],
                  ['Negligible', snap.risks.negligible, '#94a3b8'],
                ], total: snap.risks.total },
              ].map(({ title, items, total: tot }) => (
                <div key={title}>
                  <h3 style={{ fontWeight: 600, marginBottom: 12, color: '#374151', fontSize: 14 }}>{title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(([label, count, color]) => (
                      <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 80, color: '#64748b', fontSize: 12 }}>{label}</span>
                        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tot > 0 ? (Number(count) / tot * 100) : 0}%`, background: color as string, borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 24, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Compliance */}
        {snap && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>5. ISO 27001 Compliance Summary</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 56, fontWeight: 900, color: snap.compliance.score >= 80 ? '#10b981' : snap.compliance.score >= 50 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{snap.compliance.score}%</p>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Overall Compliance · {snap.compliance.coverage}% assessed</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                {[
                  ['Compliant', snap.compliance.compliant, '#10b981'],
                  ['Partial', snap.compliance.partial, '#f59e0b'],
                  ['Non-Compliant', snap.compliance.nonCompliant, '#ef4444'],
                  ['Not Applicable', snap.compliance.notApplicable, '#94a3b8'],
                ].map(([label, count, color]) => (
                  <div key={label as string} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color as string, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{count}</p>
                      <p style={{ fontSize: 10, color: '#64748b' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6. Findings */}
        {sorted.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>6. Audit Findings ({sorted.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sorted.map((f, i) => (
                <div key={f.id} style={{ border: `1px solid #e2e8f0`, borderLeft: `4px solid ${sevColors[f.severity] || '#94a3b8'}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <code style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{f.finding_number || `F-${String(i+1).padStart(3,'0')}`}</code>
                    <span style={{ background: sevColors[f.severity] || '#94a3b8', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{f.severity}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a', flex: 1 }}>{f.title}</span>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{f.status?.replace('_', ' ')}</span>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ color: '#374151', marginBottom: 10 }}>{f.description}</p>
                    {f.recommendation && (
                      <div style={{ background: '#eff6ff', borderRadius: 6, padding: 12, marginTop: 8 }}>
                        <p style={{ color: '#1d4ed8', fontWeight: 600, fontSize: 11, marginBottom: 4 }}>Recommendation</p>
                        <p style={{ color: '#374151', fontSize: 12 }}>{f.recommendation}</p>
                      </div>
                    )}
                    {(f.remediation_owner || f.remediation_deadline) && (
                      <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                        {f.remediation_owner && `Owner: ${f.remediation_owner}`}
                        {f.remediation_deadline && ` · Deadline: ${formatDate(f.remediation_deadline)}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Final Opinion */}
        {opinion && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, borderBottom: '3px solid #6366f1', paddingBottom: 10, marginBottom: 20, color: '#0f172a' }}>7. Final Opinion</h2>
            <div style={{ border: `2px solid ${opinion.barColor}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: opinion.barColor, marginBottom: 12 }}>{opinion.label}</p>
              <p style={{ color: '#374151', lineHeight: 1.8 }}>{report.opinion_notes || 'No additional notes provided.'}</p>
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
          <p>Generated by ISO Shield · {new Date(report.generated_at).toLocaleString()}</p>
          <p style={{ marginTop: 4 }}>This report is confidential. Unauthorized distribution is prohibited.</p>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN PAGE ────────────────────────────────────────────────────────────── */

export default function ReportPage() {
  const [reports, setReports] = useState<AuditReport[]>([])
  const [findings, setFindings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [previewReport, setPreviewReport] = useState<AuditReport | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [form, setForm] = useState({
    title: 'ISO 27001 Security Audit Report',
    auditor_name: '',
    audit_date: new Date().toISOString().split('T')[0],
    next_audit_date: '',
    executive_summary: '',
    methodology: 'This audit was conducted in accordance with ISO 27001:2013. The methodology included: asset inventory review, risk assessment using a 5×5 likelihood-impact matrix aligned with OWASP Top 10, ISO Annex A control checklist evaluation across all 14 domains, and evidence collection. Findings are classified by severity and linked to affected assets and controls.',
    final_opinion: 'conditional' as 'certified' | 'conditional' | 'not_certified',
    opinion_notes: '',
  })

  useEffect(() => { loadData() }, [])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)
    const [reportsRes, findingsRes] = await Promise.all([
      supabase.from('audit_reports').select('*').eq('organization_id', profile.organization_id).order('created_at', { ascending: false }),
      supabase.from('audit_findings').select('*, asset:assets(name, type), control:iso_controls(control_id, name), vulnerability:vulnerabilities(name, owasp_id)').eq('organization_id', profile.organization_id).order('severity'),
    ])
    setReports(reportsRes.data as AuditReport[] || [])
    setFindings(findingsRes.data || [])
    setLoading(false)
  }, [])

  async function handleCreate() {
    if (!orgId) return
    setCreating(true)
    const result = await generateReport(orgId, form)
    setCreating(false)
    if (result.error) { alert('Error: ' + result.error); return }
    setShowCreate(false)
    loadData()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteReport(id)
    setDeletingId(null)
    if (previewReport?.id === id) setPreviewReport(null)
    loadData()
  }

  async function handleDownloadPDF(report: AuditReport) {
    setDownloading(true)
    try {
      const { exportReportToPDF } = await import('@/lib/exportPDF')
      await exportReportToPDF(report, findings)
    } catch (err) {
      console.error('PDF export error:', err)
      setPreviewReport(report)
      await new Promise(r => setTimeout(r, 300))
      window.print()
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  /* ── PREVIEW MODE ── */
  if (previewReport) {
    const snap = previewReport.snapshot as ReportSnapshot
    const previewFindings = findings.filter(f => f.organization_id === previewReport.organization_id || true)
    return (
      <div className="flex flex-col min-h-screen">
        {/* Toolbar */}
        <div className="no-print flex-shrink-0 flex items-center justify-between px-6 py-3 bg-[#0a0f1e] border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setPreviewReport(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> Reports
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 text-sm font-medium truncate max-w-64">{previewReport.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-sm font-medium transition-all">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => handleDownloadPDF(previewReport)} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50">
              {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
          </div>
        </div>
        {/* Report */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto no-print-bg">
          <div className="max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            <ReportPreview report={previewReport} findings={previewFindings} />
          </div>
        </div>
        {/* Hidden print version */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .no-print-bg { background: white !important; padding: 0 !important; }
            body { background: white !important; margin: 0 !important; }
            @page { margin: 0; size: A4; }
          }
        `}</style>
      </div>
    )
  }

  /* ── REPORTS LIST ── */
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Audit Reports"
        subtitle="Generate, preview, and export ISO 27001 audit reports as PDF"
        actions={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white/80 text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Generate Report
          </button>
        }
      />

      {/* Info banner */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3 border border-brand-500/15">
        <BarChart3 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-slate-300 font-medium">Reports capture a snapshot of your audit data</p>
          <p className="text-slate-500 text-xs mt-0.5">Each report freezes your current assets, risks, compliance scores, and findings. Preview the report then use <strong className="text-slate-400">Print → Save as PDF</strong> in your browser to export.</p>
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map(report => {
            const snap = report.snapshot as ReportSnapshot
            const opinion = report.final_opinion ? opinionConfig[report.final_opinion] : null
            const OpIcon = opinion?.icon ?? null
            return (
              <div key={report.id} className="glass rounded-xl p-5 card-hover group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-slate-200">{report.title}</p>
                      <span className="text-xs text-slate-600 font-mono">v{report.version}</span>
                      {opinion && OpIcon && (
                        <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${opinion.bg} ${opinion.border} ${opinion.color}`}>
                          <OpIcon className="w-3 h-3" />
                          {opinion.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.auditor_name && `${report.auditor_name} · `}
                      {report.audit_date ? formatDate(report.audit_date) : 'No date'} · Generated {formatDate(report.generated_at)}
                    </p>
                    {snap && (
                      <div className="flex items-center gap-4 mt-2">
                        {[
                          { label: 'Assets', value: snap.assets.total },
                          { label: 'Risks', value: snap.risks.total },
                          { label: 'Compliance', value: `${snap.compliance.score}%` },
                          { label: 'Findings', value: snap.findings.total },
                        ].map(({ label, value }) => (
                          <div key={label} className="text-center">
                            <p className="text-sm font-bold text-white tabular-nums">{value}</p>
                            <p className="text-[10px] text-slate-600">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreviewReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-xs font-medium transition-all">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => handleDownloadPDF(report)} disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-400 text-xs font-medium transition-all disabled:opacity-50">
                      {downloading ? <div className="w-3.5 h-3.5 border border-brand-400/30 border-t-brand-400 rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download PDF
                    </button>
                    <button onClick={() => handleDelete(report.id)} disabled={deletingId === report.id}
                      className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                      {deletingId === report.id ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-16 text-center">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Reports Yet</h3>
          <p className="text-slate-600 text-sm mb-5">Generate your first ISO 27001 audit report — it will capture a complete snapshot of all your data.</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Generate First Report
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-xl glass rounded-2xl max-h-[92vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0d1424] z-10">
              <div>
                <h3 className="text-base font-semibold text-white">Generate Audit Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">Creates a snapshot of all current audit data</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label-dark">Report Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Auditor Name</label>
                  <input type="text" value={form.auditor_name} onChange={e => setForm({ ...form, auditor_name: e.target.value })} className="input-dark" placeholder="John Doe, CISA" />
                </div>
                <div>
                  <label className="label-dark">Audit Date</label>
                  <input type="date" value={form.audit_date} onChange={e => setForm({ ...form, audit_date: e.target.value })} className="input-dark" />
                </div>
              </div>
              <div>
                <label className="label-dark">Next Audit Date (optional)</label>
                <input type="date" value={form.next_audit_date} onChange={e => setForm({ ...form, next_audit_date: e.target.value })} className="input-dark" />
              </div>
              <div>
                <label className="label-dark">Executive Summary</label>
                <textarea value={form.executive_summary} onChange={e => setForm({ ...form, executive_summary: e.target.value })}
                  className="input-dark h-28 resize-none" placeholder="Provide a high-level summary of the audit objectives, scope, approach, and key findings..." />
              </div>
              <div>
                <label className="label-dark">Methodology</label>
                <textarea value={form.methodology} onChange={e => setForm({ ...form, methodology: e.target.value })} className="input-dark h-24 resize-none" />
              </div>
              <div>
                <label className="label-dark">Final Opinion</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(Object.entries(opinionConfig) as [string, typeof opinionConfig['certified']][]).map(([value, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={value} type="button" onClick={() => setForm({ ...form, final_opinion: value as any })}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${form.final_opinion === value ? `${cfg.bg} ${cfg.border}` : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${form.final_opinion === value ? cfg.color : 'text-slate-600'}`} />
                        <span className={`text-xs font-medium ${form.final_opinion === value ? 'text-slate-200' : 'text-slate-500'}`}>{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="label-dark">Opinion Basis</label>
                <textarea value={form.opinion_notes} onChange={e => setForm({ ...form, opinion_notes: e.target.value })}
                  className="input-dark h-20 resize-none" placeholder="Explain the reasoning behind the final opinion..." />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-[#0d1424]">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
