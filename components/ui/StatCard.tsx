import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'brand' | 'red' | 'orange' | 'green' | 'yellow'
  className?: string
}

const colorMap = {
  brand: {
    icon: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    glow: '',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: '',
  },
  orange: {
    icon: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: '',
  },
  green: {
    icon: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: '',
  },
  yellow: {
    icon: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: '',
  },
}

export default function StatCard({ label, value, icon: Icon, trend, color = 'brand', className }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className={cn(
      'glass rounded-xl p-5 card-hover transition-all duration-200',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', c.bg, c.border)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-md',
            trend.value > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          )}>
            {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
}
