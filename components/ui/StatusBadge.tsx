import { cn } from '@/lib/utils'
import type { control_status } from '@/types/phase2'
import { CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: control_status
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircle2,
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  partial: {
    label: 'Partial',
    icon: AlertCircle,
    classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  non_compliant: {
    label: 'Non-Compliant',
    icon: XCircle,
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
  not_applicable: {
    label: 'N/A',
    icon: MinusCircle,
    classes: 'bg-slate-500/15 text-slate-500 border-slate-600/30',
    dot: 'bg-slate-600',
  },
}

export default function StatusBadge({ status, size = 'md', showIcon = false, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md font-medium border',
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      config.classes,
      className
    )}>
      {showIcon
        ? <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        : <span className={cn('rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5', config.dot)} />
      }
      {config.label}
    </span>
  )
}
