import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RiskLevel, AssetCriticality } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(level: RiskLevel | string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    negligible: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  }
  return colors[level] || colors.negligible
}

export function getRiskBadgeColor(level: RiskLevel | string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
    negligible: 'bg-slate-500',
  }
  return colors[level] || colors.negligible
}

export function getCriticalityColor(level: AssetCriticality | string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
  }
  return colors[level] || colors.low
}

export function getRiskMatrixColor(score: number): string {
  if (score >= 20) return 'bg-red-500'
  if (score >= 12) return 'bg-orange-500'
  if (score >= 6) return 'bg-yellow-500'
  if (score >= 2) return 'bg-green-500'
  return 'bg-slate-600'
}

export function formatRiskLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function formatAssetType(type: string): string {
  const labels: Record<string, string> = {
    hardware: 'Hardware',
    software: 'Software',
    data: 'Data/Information',
    service: 'Service',
    personnel: 'Personnel',
    facility: 'Facility',
  }
  return labels[type] || type
}

export function formatSector(sector: string): string {
  const labels: Record<string, string> = {
    financial: 'Financial Services',
    healthcare: 'Healthcare',
    government: 'Government',
    education: 'Education',
    retail: 'Retail & E-commerce',
    manufacturing: 'Manufacturing',
    technology: 'Technology',
    telecommunications: 'Telecommunications',
    other: 'Other',
  }
  return labels[sector] || sector
}

export function formatExposureLevel(level: string): string {
  const labels: Record<string, string> = {
    internet_facing: 'Internet-Facing',
    internal: 'Internal Only',
    restricted: 'Restricted',
    air_gapped: 'Air-Gapped',
  }
  return labels[level] || level
}

export function getCIALabel(value: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Very High',
  }
  return labels[value] || 'Unknown'
}

export function calculateRiskLevel(likelihood: number, impact: number): RiskLevel {
  const score = likelihood * impact
  if (score >= 20) return 'critical'
  if (score >= 12) return 'high'
  if (score >= 6) return 'medium'
  if (score >= 2) return 'low'
  return 'negligible'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
