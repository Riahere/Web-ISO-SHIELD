/**
 * ISO Shield — PDF Export Utility
 * Uses jsPDF + jspdf-autotable to generate a proper PDF (no browser print dialog).
 */

import type { AuditReport, ReportSnapshot } from '@/types/phase3'

// Lazy-load jsPDF to avoid SSR issues
async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  return jsPDF
}

const COLORS = {
  brand:    [99, 102, 241] as [number, number, number],
  bg:       [15, 23, 42]   as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  slate50:  [248, 250, 252] as [number, number, number],
  slate200: [226, 232, 240] as [number, number, number],
  slate400: [148, 163, 184] as [number, number, number],
  slate600: [71, 85, 105]   as [number, number, number],
  slate800: [30, 41, 59]    as [number, number, number],
  red:      [239, 68, 68]   as [number, number, number],
  orange:   [249, 115, 22]  as [number, number, number],
  yellow:   [234, 179, 8]   as [number, number, number],
  green:    [34, 197, 94]   as [number, number, number],
  blue:     [59, 130, 246]  as [number, number, number],
  emerald:  [16, 185, 129]  as [number, number, number],
  amber:    [245, 158, 11]  as [number, number, number],
}

const SEV_COLORS: Record<string, [number, number, number]> = {
  critical: COLORS.red,
  high:     COLORS.orange,
  medium:   COLORS.yellow,
  low:      COLORS.green,
  informational: COLORS.blue,
}

function formatDateStr(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatSec(s: string) {
  const map: Record<string, string> = {
    financial: 'Financial Services', healthcare: 'Healthcare', government: 'Government',
    education: 'Education', retail: 'Retail', manufacturing: 'Manufacturing',
    technology: 'Technology', telecommunications: 'Telecommunications', other: 'Other',
  }
  return map[s] || s
}

function truncate(str: string, max: number) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max - 3) + '…' : str
}

// Draw a horizontal bar
function drawBar(doc: any, x: number, y: number, w: number, h: number, pct: number, color: [number, number, number], bgColor: [number, number, number] = [226, 232, 240]) {
  doc.setFillColor(...bgColor)
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F')
  if (pct > 0) {
    doc.setFillColor(...color)
    doc.roundedRect(x, y, Math.max(w * pct, h), h, h / 2, h / 2, 'F')
  }
}

// Draw a section heading
function sectionHeader(doc: any, y: number, text: string, pageW: number, margin: number) {
  doc.setFillColor(...COLORS.brand)
  doc.rect(margin, y, pageW - margin * 2, 0.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.bg)
  doc.text(text, margin, y - 4)
  return y + 8
}

// Add page header/footer
function addPageChrome(doc: any, pageNum: number, title: string, pageW: number, pageH: number) {
  // Header bar
  doc.setFillColor(...COLORS.bg)
  doc.rect(0, 0, pageW, 14, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.white)
  doc.text('ISO Shield', 14, 9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.slate400)
  doc.text(truncate(title, 60), 40, 9)
  doc.setTextColor(...COLORS.slate400)
  doc.text(`Page ${pageNum}`, pageW - 14, 9, { align: 'right' })

  // Footer
  doc.setFillColor(...COLORS.slate200)
  doc.rect(0, pageH - 10, pageW, 0.3, 'F')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.slate400)
  doc.text('Confidential — ISO 27001 Security Audit Report', 14, pageH - 5)
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageW - 14, pageH - 5, { align: 'right' })
}

export async function exportReportToPDF(report: AuditReport, findings: any[]) {
  const JsPDF = await getJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any

  const snap = report.snapshot as ReportSnapshot
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let page = 1

  const opinionColors: Record<string, [number, number, number]> = {
    certified: COLORS.emerald,
    conditional: COLORS.amber,
    not_certified: COLORS.red,
  }
  const opinionLabels: Record<string, string> = {
    certified: 'Certified', conditional: 'Conditional', not_certified: 'Not Certified',
  }

  // ──────────────────────────────────────────────────
  // COVER PAGE
  // ──────────────────────────────────────────────────

  // Dark background
  doc.setFillColor(...COLORS.bg)
  doc.rect(0, 0, pageW, pageH, 'F')

  // Accent strip
  doc.setFillColor(...COLORS.brand)
  doc.rect(0, 0, 6, pageH, 'F')

  // Logo area
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(14, 20, 24, 24, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.brand)
  doc.text('IS', 26, 36, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...COLORS.white)
  doc.text('ISO Shield', 42, 35)

  // Tag line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.slate400)
  doc.text('ISO 27001 SECURITY AUDIT PLATFORM', 14, 52)

  // Divider
  doc.setFillColor(...COLORS.brand)
  doc.rect(14, 58, 60, 0.8, 'F')

  // Report title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...COLORS.white)
  const titleLines = doc.splitTextToSize(report.title, contentW - 10)
  doc.text(titleLines, 14, 78)

  // Metadata table
  const metaY = 78 + titleLines.length * 12 + 10
  const meta = [
    ['Organization', snap?.organization?.name || '—'],
    ['Sector', snap?.organization?.sector ? formatSec(snap.organization.sector) : '—'],
    ['Audit Date', formatDateStr(report.audit_date)],
    ['Auditor', report.auditor_name || '—'],
    ['Report Version', `v${report.version}`],
    ['Next Audit', formatDateStr(report.next_audit_date)],
  ]

  doc.setFontSize(9)
  meta.forEach(([k, v], i) => {
    const row = metaY + i * 10
    doc.setTextColor(...COLORS.slate400)
    doc.setFont('helvetica', 'normal')
    doc.text(k, 14, row)
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.text(v, 80, row)
    doc.setFillColor(30, 41, 59)
    doc.rect(14, row + 2, contentW, 0.2, 'F')
  })

  // Final opinion badge
  if (report.final_opinion) {
    const opColor = opinionColors[report.final_opinion] || COLORS.slate400
    const opLabel = opinionLabels[report.final_opinion] || report.final_opinion
    const badgeY = metaY + meta.length * 10 + 16
    doc.setFillColor(opColor[0], opColor[1], opColor[2], 0.15)
    doc.roundedRect(14, badgeY, 80, 10, 2, 2, 'F')
    doc.setDrawColor(...opColor)
    doc.setLineWidth(0.5)
    doc.roundedRect(14, badgeY, 80, 10, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...opColor)
    doc.text(`Final Opinion: ${opLabel}`, 54, badgeY + 6.5, { align: 'center' })
  }

  // Stat boxes at bottom of cover
  if (snap) {
    const boxes = [
      { label: 'Assets', value: String(snap.assets.total), sub: `${snap.assets.critical} critical` },
      { label: 'Risks', value: String(snap.risks.total), sub: `${snap.risks.critical + snap.risks.high} high+` },
      { label: 'Compliance', value: `${snap.compliance.score}%`, sub: `${snap.compliance.coverage}% assessed` },
      { label: 'Findings', value: String(snap.findings.total), sub: `${snap.findings.open} open` },
    ]
    const bw = contentW / boxes.length - 3
    boxes.forEach((b, i) => {
      const bx = margin + i * (bw + 4)
      const by = pageH - 52
      doc.setFillColor(30, 41, 59)
      doc.roundedRect(bx, by, bw, 32, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...COLORS.white)
      doc.text(b.value, bx + bw / 2, by + 14, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.slate400)
      doc.text(b.label.toUpperCase(), bx + bw / 2, by + 20, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(99, 102, 241)
      doc.text(b.sub, bx + bw / 2, by + 26, { align: 'center' })
    })
  }

  // ──────────────────────────────────────────────────
  // PAGE 2 — Executive Summary + Scope
  // ──────────────────────────────────────────────────
  doc.addPage()
  page++
  addPageChrome(doc, page, report.title, pageW, pageH)

  let y = 24

  // Executive Summary
  y = sectionHeader(doc, y, '1. Executive Summary', pageW, margin)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...COLORS.slate600)
  if (report.executive_summary) {
    const lines = doc.splitTextToSize(report.executive_summary, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 10
  } else {
    doc.setTextColor(...COLORS.slate400)
    doc.text('No executive summary provided.', margin, y)
    y += 10
  }

  // Key metrics
  if (snap) {
    const metrics = [
      { label: 'Total Assets', value: snap.assets.total, sub: `${snap.assets.critical} critical`, color: COLORS.slate600 },
      { label: 'Risk Items', value: snap.risks.total, sub: `${snap.risks.critical + snap.risks.high} high/critical`, color: COLORS.red },
      { label: 'ISO Compliance', value: `${snap.compliance.score}%`, sub: `${snap.compliance.coverage}% coverage`, color: snap.compliance.score >= 80 ? COLORS.emerald : snap.compliance.score >= 50 ? COLORS.amber : COLORS.red },
      { label: 'Findings', value: snap.findings.total, sub: `${snap.findings.open} open`, color: COLORS.slate600 },
    ]
    const mw = contentW / metrics.length - 3
    metrics.forEach((m, i) => {
      const mx = margin + i * (mw + 4)
      doc.setFillColor(...COLORS.slate50)
      doc.setDrawColor(...COLORS.slate200)
      doc.setLineWidth(0.3)
      doc.roundedRect(mx, y, mw, 22, 2, 2, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...m.color)
      doc.text(String(m.value), mx + mw / 2, y + 10, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(m.label.toUpperCase(), mx + mw / 2, y + 15, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...COLORS.slate400)
      doc.text(m.sub, mx + mw / 2, y + 19, { align: 'center' })
    })
    y += 30
  }

  // Scope
  y = sectionHeader(doc, y, '2. Scope & Organization', pageW, margin)
  if (snap?.organization) {
    const rows = [
      ['Organization', snap.organization.name || '—'],
      ['Sector', formatSec(snap.organization.sector)],
      ['Employees', snap.organization.employee_count?.toString() || '—'],
      ['Exposure Level', snap.organization.exposure_level?.replace(/_/g, ' ') || '—'],
      ['Audit Period Start', formatDateStr(snap.organization.audit_period_start)],
      ['Audit Period End', formatDateStr(snap.organization.audit_period_end)],
      ['Auditor', report.auditor_name || '—'],
      ['Next Audit Date', formatDateStr(report.next_audit_date)],
    ]
    rows.forEach(([k, v], i) => {
      const rowY = y + i * 7
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.slate50)
        doc.rect(margin, rowY - 4, contentW, 7, 'F')
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(k, margin + 2, rowY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.bg)
      doc.text(v, margin + 60, rowY)
    })
    y += rows.length * 7 + 6

    if (snap.organization.scope_description) {
      doc.setFillColor(239, 246, 255)
      doc.setDrawColor(99, 102, 241)
      doc.setLineWidth(0.5)
      const scopeLines = doc.splitTextToSize(snap.organization.scope_description, contentW - 12)
      doc.roundedRect(margin, y, contentW, scopeLines.length * 4.5 + 8, 2, 2, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(scopeLines, margin + 6, y + 6)
      y += scopeLines.length * 4.5 + 14
    }
  }

  // Methodology
  if (report.methodology) {
    if (y > pageH - 50) { doc.addPage(); page++; addPageChrome(doc, page, report.title, pageW, pageH); y = 24 }
    y = sectionHeader(doc, y, '3. Methodology', pageW, margin)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...COLORS.slate600)
    const mlines = doc.splitTextToSize(report.methodology, contentW)
    doc.text(mlines, margin, y)
    y += mlines.length * 5 + 10
  }

  // ──────────────────────────────────────────────────
  // PAGE — Risk Assessment
  // ──────────────────────────────────────────────────
  if (snap) {
    doc.addPage()
    page++
    addPageChrome(doc, page, report.title, pageW, pageH)
    y = 24
    y = sectionHeader(doc, y, '4. Risk Assessment Results', pageW, margin)

    // Assets section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.bg)
    doc.text(`Asset Inventory — ${snap.assets.total} total`, margin, y)
    y += 6
    const assetRows = [
      ['Critical', snap.assets.critical, COLORS.red],
      ['High', snap.assets.high, COLORS.orange],
      ['Medium', snap.assets.medium, COLORS.yellow],
      ['Low', snap.assets.low, COLORS.green],
    ] as [string, number, [number,number,number]][]

    const halfW = contentW / 2 - 4
    assetRows.forEach(([label, count, color], i) => {
      const rowY = y + i * 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(label, margin, rowY + 3)
      drawBar(doc, margin + 22, rowY, halfW - 32, 5, snap.assets.total > 0 ? count / snap.assets.total : 0, color)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.bg)
      doc.text(String(count), margin + halfW - 6, rowY + 3.5, { align: 'right' })
    })
    y += assetRows.length * 10 + 6

    // Asset types
    if (snap.assets.byType && Object.keys(snap.assets.byType).length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.slate600)
      doc.text('By Type:', margin, y)
      y += 5
      const typeEntries = Object.entries(snap.assets.byType)
      typeEntries.forEach(([type, count], i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const tx = margin + col * (halfW + 4)
        const ty = y + row * 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.slate600)
        doc.text(type.charAt(0).toUpperCase() + type.slice(1), tx, ty + 3)
        drawBar(doc, tx + 24, ty, halfW - 34, 4, snap.assets.total > 0 ? count / snap.assets.total : 0, COLORS.brand)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.bg)
        doc.text(String(count), tx + halfW - 6, ty + 3.5, { align: 'right' })
      })
      y += (Math.ceil(typeEntries.length / 2)) * 8 + 8
    }

    // Risk distribution
    if (y > pageH - 80) { doc.addPage(); page++; addPageChrome(doc, page, report.title, pageW, pageH); y = 24 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.bg)
    doc.text(`Risk Distribution — ${snap.risks.total} total`, margin, y)
    y += 6
    const riskRows = [
      ['Critical', snap.risks.critical, COLORS.red],
      ['High', snap.risks.high, COLORS.orange],
      ['Medium', snap.risks.medium, COLORS.yellow],
      ['Low', snap.risks.low, COLORS.green],
      ['Negligible', snap.risks.negligible, COLORS.slate400],
    ] as [string, number, [number,number,number]][]

    riskRows.forEach(([label, count, color], i) => {
      const rowY = y + i * 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(label, margin, rowY + 3)
      drawBar(doc, margin + 26, rowY, contentW - 42, 5, snap.risks.total > 0 ? count / snap.risks.total : 0, color)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.bg)
      doc.text(String(count), margin + contentW - 6, rowY + 3.5, { align: 'right' })
    })
    y += riskRows.length * 10 + 10

    // ── Compliance
    if (y > pageH - 80) { doc.addPage(); page++; addPageChrome(doc, page, report.title, pageW, pageH); y = 24 }
    y = sectionHeader(doc, y, '5. ISO 27001 Compliance Summary', pageW, margin)

    // Big score circle (drawn as arcs)
    const scoreColor = snap.compliance.score >= 80 ? COLORS.emerald : snap.compliance.score >= 50 ? COLORS.amber : COLORS.red
    const cx = margin + 28, cy = y + 24, r = 22
    doc.setDrawColor(...COLORS.slate200)
    doc.setLineWidth(3)
    doc.circle(cx, cy, r, 'S')
    // Score arc approximation
    doc.setDrawColor(...scoreColor)
    doc.setLineWidth(3)
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (snap.compliance.score / 100) * 2 * Math.PI
    // Draw arc segments
    const steps = 60
    for (let s = 0; s < steps; s++) {
      const t1 = startAngle + (endAngle - startAngle) * (s / steps)
      const t2 = startAngle + (endAngle - startAngle) * ((s + 1) / steps)
      if (t2 > startAngle) {
        doc.line(
          cx + r * Math.cos(t1), cy + r * Math.sin(t1),
          cx + r * Math.cos(t2), cy + r * Math.sin(t2)
        )
      }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...scoreColor)
    doc.text(`${snap.compliance.score}%`, cx, cy + 3, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.slate400)
    doc.text('Compliant', cx, cy + 9, { align: 'center' })

    // Status breakdown
    const statBars = [
      ['Compliant', snap.compliance.compliant, COLORS.emerald],
      ['Partial', snap.compliance.partial, COLORS.amber],
      ['Non-Compliant', snap.compliance.nonCompliant, COLORS.red],
      ['Not Applicable', snap.compliance.notApplicable, COLORS.slate400],
    ] as [string, number, [number,number,number]][]
    const totalC = snap.compliance.total || 1

    statBars.forEach(([label, count, color], i) => {
      const rx = cx + r + 12
      const ry = y + i * 13
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.slate600)
      doc.text(label, rx, ry + 3)
      drawBar(doc, rx + 34, ry, contentW - cx - r - 50, 5, count / totalC, color)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.bg)
      doc.text(String(count), margin + contentW - 6, ry + 3.5, { align: 'right' })
    })
    y += 60
  }

  // ──────────────────────────────────────────────────
  // FINDINGS TABLE
  // ──────────────────────────────────────────────────
  const sortedFindings = [...findings].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 }
    return (order[a.severity] ?? 5) - (order[b.severity] ?? 5)
  })

  if (sortedFindings.length > 0) {
    doc.addPage()
    page++
    addPageChrome(doc, page, report.title, pageW, pageH)
    y = 24

    y = sectionHeader(doc, y, `6. Audit Findings (${sortedFindings.length})`, pageW, margin)

    // Summary row
    if (snap) {
      const fsum = [
        { label: 'Critical', count: snap.findings.critical, color: COLORS.red },
        { label: 'High', count: snap.findings.high, color: COLORS.orange },
        { label: 'Medium', count: snap.findings.medium, color: COLORS.yellow },
        { label: 'Low', count: snap.findings.low, color: COLORS.green },
        { label: 'Open', count: snap.findings.open, color: COLORS.slate600 },
        { label: 'Resolved', count: snap.findings.resolved, color: COLORS.emerald },
      ]
      const fw = contentW / fsum.length - 2
      fsum.forEach((f, i) => {
        const fx = margin + i * (fw + 2)
        doc.setFillColor(...COLORS.slate50)
        doc.setDrawColor(...COLORS.slate200)
        doc.setLineWidth(0.2)
        doc.roundedRect(fx, y, fw, 14, 1.5, 1.5, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(...f.color)
        doc.text(String(f.count), fx + fw / 2, y + 7, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(...COLORS.slate400)
        doc.text(f.label.toUpperCase(), fx + fw / 2, y + 12, { align: 'center' })
      })
      y += 20
    }

    // Table
    ;(doc as any).autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Severity', 'Finding', 'Asset / Control', 'Status', 'Deadline']],
      body: sortedFindings.map((f, i) => [
        f.finding_number || `F-${String(i + 1).padStart(3, '0')}`,
        f.severity?.toUpperCase() || '—',
        truncate(f.title, 55),
        truncate(
          (f.asset as any)?.name || (f.control as any)?.control_id || '—',
          24
        ),
        f.status?.replace('_', ' ') || '—',
        f.remediation_deadline ? new Date(f.remediation_deadline).toLocaleDateString() : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: COLORS.bg, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 68 },
        3: { cellWidth: 32 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 24, halign: 'center' },
      },
      didDrawCell: (data: any) => {
        if (data.column.index === 1 && data.section === 'body') {
          const sev = data.cell.raw?.toLowerCase()
          const color = SEV_COLORS[sev] || COLORS.slate400
          doc.setFillColor(...color)
          doc.roundedRect(data.cell.x + 1, data.cell.y + 1.5, data.cell.width - 2, data.cell.height - 3, 1, 1, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(...COLORS.white)
          doc.text(data.cell.raw || '', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
        }
      },
      alternateRowStyles: { fillColor: COLORS.slate50 },
      didAddPage: () => { page++; addPageChrome(doc, page, report.title, pageW, pageH) },
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // Detail for each finding
    sortedFindings.forEach((f, i) => {
      if (!f.recommendation && !f.description) return
      if (y > pageH - 60) { doc.addPage(); page++; addPageChrome(doc, page, report.title, pageW, pageH); y = 24 }

      const sevColor = SEV_COLORS[f.severity] || COLORS.slate400
      // Finding card
      doc.setFillColor(...COLORS.slate50)
      doc.setDrawColor(...COLORS.slate200)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, y, contentW, 6, 1, 1, 'FD')
      // Left color accent
      doc.setFillColor(...sevColor)
      doc.roundedRect(margin, y, 2.5, 6, 1, 1, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.bg)
      doc.text(`${f.finding_number || `F-${String(i+1).padStart(3,'0')}`} — ${truncate(f.title, 80)}`, margin + 5, y + 4)
      y += 9

      if (f.description) {
        const dlines = doc.splitTextToSize(f.description, contentW - 4)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.slate600)
        doc.text(dlines.slice(0, 3), margin + 2, y)
        y += Math.min(dlines.length, 3) * 4 + 2
      }
      if (f.recommendation) {
        doc.setFillColor(239, 246, 255)
        const rlines = doc.splitTextToSize(f.recommendation, contentW - 12)
        doc.roundedRect(margin + 2, y, contentW - 4, Math.min(rlines.length, 3) * 4 + 6, 1, 1, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(37, 99, 235)
        doc.text('Recommendation:', margin + 4, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.slate600)
        doc.text(rlines.slice(0, 3), margin + 4, y + 8)
        y += Math.min(rlines.length, 3) * 4 + 10
      }
      y += 4
    })
  }

  // ──────────────────────────────────────────────────
  // FINAL OPINION PAGE
  // ──────────────────────────────────────────────────
  if (report.final_opinion) {
    doc.addPage()
    page++
    addPageChrome(doc, page, report.title, pageW, pageH)
    y = 24
    y = sectionHeader(doc, y, '7. Final Opinion', pageW, margin)

    const opColor = opinionColors[report.final_opinion] || COLORS.slate600
    const opLabel = opinionLabels[report.final_opinion] || report.final_opinion

    doc.setFillColor(opColor[0], opColor[1], opColor[2])
    doc.setFillColor(opColor[0], opColor[1], opColor[2], 0.08)
    doc.setDrawColor(...opColor)
    doc.setLineWidth(1)
    const boxH = report.opinion_notes ? 50 : 30
    doc.roundedRect(margin, y, contentW, boxH, 4, 4, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...opColor)
    doc.text(opLabel, margin + 8, y + 16)

    if (report.opinion_notes) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...COLORS.slate600)
      const olines = doc.splitTextToSize(report.opinion_notes, contentW - 16)
      doc.text(olines, margin + 8, y + 26)
    }
    y += boxH + 16

    // Signature block
    doc.setFillColor(...COLORS.slate50)
    doc.roundedRect(margin, y, contentW, 40, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.slate600)
    doc.text('Lead Auditor', margin + 10, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.text(report.auditor_name || '___________________________', margin + 10, y + 18)
    doc.setFillColor(...COLORS.slate200)
    doc.rect(margin + 10, y + 22, 70, 0.3, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.slate400)
    doc.text('Signature', margin + 10, y + 27)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.slate600)
    doc.text('Audit Date', margin + 110, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.text(formatDateStr(report.audit_date), margin + 110, y + 18)
    doc.setFillColor(...COLORS.slate200)
    doc.rect(margin + 110, y + 22, 60, 0.3, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.slate400)
    doc.text('Date', margin + 110, y + 27)
  }

  // Save
  const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
