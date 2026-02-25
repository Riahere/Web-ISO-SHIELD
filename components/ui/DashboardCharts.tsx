'use client'

// Pure CSS/SVG charts — no external library needed

// ── Risk Bar Chart ────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  critical:   '#ef4444',
  high:       '#f97316',
  medium:     '#eab308',
  low:        '#22c55e',
  negligible: '#94a3b8',
}

const RISK_LABEL: Record<string, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', negligible: 'Negligible',
}

interface RiskItem { level: string; count: number }
interface TypeItem { type: string; count: number }

export function RiskBarChart({ data }: { data: RiskItem[] }) {
  const filtered = data.filter(d => d.count > 0)
  if (!filtered.length) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      Belum ada data vulnerability
    </div>
  )

  const max = Math.max(...filtered.map(d => d.count), 1)

  return (
    <div className="space-y-2.5 mt-2">
      {data.map(({ level, count }) => (
        <div key={level} className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 w-14 flex-shrink-0 capitalize">{RISK_LABEL[level]}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: RISK_COLORS[level],
                minWidth: count > 0 ? '8px' : '0',
              }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums w-5 text-right"
            style={{ color: count > 0 ? RISK_COLORS[level] : '#cbd5e1' }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Asset Donut Chart (SVG) ───────────────────────────────────
const TYPE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']
const TYPE_LABEL: Record<string, string> = {
  hardware: 'Hardware', software: 'Software', data: 'Data',
  service: 'Service', personnel: 'Personnel', facility: 'Facility',
}

export function AssetDonutChart({ data }: { data: TypeItem[] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      Belum ada asset
    </div>
  )

  const total = data.reduce((s, d) => s + d.count, 0)
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 44
  const innerR = 28
  const gap = 2

  // Build pie slices
  let cumAngle = -90
  const slices = data.map((d, i) => {
    const angle = (d.count / total) * 360
    const start = cumAngle
    cumAngle += angle
    return { ...d, startAngle: start, endAngle: cumAngle - gap, color: TYPE_COLORS[i % TYPE_COLORS.length] }
  })

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function describeSlice(startAngle: number, endAngle: number) {
    const s1 = polarToXY(startAngle, r)
    const e1 = polarToXY(endAngle, r)
    const s2 = polarToXY(endAngle, innerR)
    const e2 = polarToXY(startAngle, innerR)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y} Z`
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s) => (
          <path key={s.type} d={describeSlice(s.startAngle, s.endAngle)} fill={s.color} opacity={0.9} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight="700" fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">assets</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s) => (
          <div key={s.type} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-slate-500 flex-1 truncate">{TYPE_LABEL[s.type] ?? s.type}</span>
            <span className="text-[10px] font-bold text-slate-700">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Security Score Gauge (SVG) ────────────────────────────────
export function SecurityScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'At Risk' : 'Critical'

  const R = 52
  const cx = 80
  const cy = 72
  const circumference = Math.PI * R  // half circle
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width={160} height={90} viewBox="0 0 160 90">
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke="#f1f5f9" strokeWidth={10} strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={26} fontWeight="800" fill={color}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fontWeight="600" fill={color}>{label}</text>
      </svg>
    </div>
  )
}