'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield, LayoutDashboard, Building2, Server, BarChart3,
  ClipboardList, FolderOpen, PieChart, AlertTriangle,
  FileText, Sparkles, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'Setup',
    items: [
      { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
      { href: '/organization', label: 'Organization', icon: Building2 },
      { href: '/assets',       label: 'Assets',       icon: Server },
    ],
  },
  {
    label: 'Risk Assessment',
    items: [
      { href: '/risk',         label: 'Risk Matrix',  icon: BarChart3 },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/checklist',  label: 'ISO Checklist', icon: ClipboardList },
      { href: '/evidence',   label: 'Evidence',      icon: FolderOpen },
      { href: '/compliance', label: 'Compliance',    icon: PieChart },
    ],
  },
  {
    label: 'Audit',
    items: [
      { href: '/findings', label: 'Findings',     icon: AlertTriangle },
      { href: '/report',   label: 'Audit Report', icon: FileText },
    ],
  },
]

const PHASE_ACCENT = [
  { bg: 'rgba(99,102,241,0.14)',  border: 'rgba(99,102,241,0.26)',  text: '#c7d2fe', icon: '#a5b4fc', dot: '#818cf8' }, // indigo
  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.24)',  text: '#a7f3d0', icon: '#6ee7b7', dot: '#34d399' }, // emerald
  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)',  text: '#fde68a', icon: '#fcd34d', dot: '#f59e0b' }, // amber
    { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.22)',   text: '#fecaca', icon: '#fca5a5', dot: '#f87171' }, // red
]

const AI_ACCENT = {
  bg: 'rgba(52,211,153,0.11)', border: 'rgba(52,211,153,0.22)', text: '#6ee7b7', icon: '#34d399', dot: '#34d399',
}

const HREF_PHASE: Record<string, number> = {}
NAV_SECTIONS.forEach(({ items }, idx) => items.forEach(({ href }) => (HREF_PHASE[href] = idx)))

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  function NavItem({
    href, label, Icon, accent,
  }: {
    href: string
    label: string
    Icon: React.ElementType
    accent: typeof PHASE_ACCENT[0]
  }) {
    const active = isActive(href)

    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className="group flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-all duration-150"
        style={
          active
            ? {
                background: accent.bg,
                border: `1px solid ${accent.border}`,
                color: accent.text,
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              }
            : { color: 'rgba(255,255,255,0.32)', border: '1px solid transparent' }
        }
        onMouseEnter={e => {
          if (active) return
          const el = e.currentTarget as HTMLElement
          el.style.color      = 'rgba(255,255,255,0.72)'
          el.style.background = 'rgba(255,255,255,0.055)'
          el.style.borderColor = 'rgba(255,255,255,0.07)'
        }}
        onMouseLeave={e => {
          if (active) return
          const el = e.currentTarget as HTMLElement
          el.style.color       = 'rgba(255,255,255,0.32)'
          el.style.background  = 'transparent'
          el.style.borderColor = 'transparent'
        }}
      >
        <Icon
          className="w-[15px] h-[15px] flex-shrink-0"
          style={{ color: active ? accent.icon : undefined }}
        />
        <span className="flex-1 truncate">{label}</span>
        {active && (
          <span
            className="w-[6px] h-[6px] rounded-full flex-shrink-0"
            style={{ background: accent.dot, boxShadow: `0 0 6px ${accent.dot}` }}
          />
        )}
      </Link>
    )
  }

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full select-none">

        <div className="px-4 pt-5 pb-4">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))',
                border: '1px solid rgba(139,92,246,0.32)',
                boxShadow: '0 0 18px rgba(139,92,246,0.18)',
              }}
            >
              <Shield className="w-[18px] h-[18px]" style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight" style={{ color: '#eef0fa' }}>
                ISO Shield
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#3a4a6b' }}>
                ISO 27001 Platform
              </p>
            </div>
          </Link>
        </div>

        <div className="mx-4 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        <nav className="flex-1 px-3 overflow-y-auto pb-3 space-y-4">
          {NAV_SECTIONS.map(({ label, items }, sIdx) => (
            <div key={label}>
              <div className="flex items-center gap-2 px-2 mb-1.5">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: 'rgba(255,255,255,0.16)' }}
                >
                  {label}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <div className="space-y-[2px]">
                {items.map(({ href, label: l, icon: Icon }) => (
                  <NavItem
                    key={href}
                    href={href}
                    label={l}
                    Icon={Icon}
                    accent={PHASE_ACCENT[sIdx]}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-4 mt-1 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        <div className="px-4 pb-5">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.055)',
            }}
          >
        
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: '#34d399' }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: '#34d399' }}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                ISO 27001:2022
              </p>
              <p className="text-[9.5px] mt-0.5" style={{ color: '#3a4a6b' }}>Audit sedang aktif</p>
            </div>
          </div>
        </div>

      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{
          background: 'rgba(14,17,24,0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Menu className="w-4 h-4" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(170deg, #1a2035 0%, #131829 55%, #0e1118 100%)' }}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <SidebarContent />
      </aside>

      <aside
        className="hidden lg:flex w-60 flex-shrink-0 h-screen sticky top-0 flex-col"
        style={{ background: 'linear-gradient(170deg, #1a2035 0%, #131829 55%, #0e1118 100%)' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}