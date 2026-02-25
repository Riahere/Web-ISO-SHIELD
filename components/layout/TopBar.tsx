'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Users, LogOut, ChevronDown, X, User, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface TopBarProps {
  profile: {
    full_name: string | null
    email: string | null
    role: string
    avatar_url: string | null  // ← tambah ini
  } | null
}

const roleBadgeColor: Record<string, string> = {
  admin:   'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  auditor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  auditee: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

// Komponen avatar kecil: tampilkan foto kalau ada, inisial kalau tidak
function AvatarThumb({
  avatarUrl, name, size = 'sm'
}: {
  avatarUrl: string | null
  name: string | null
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  if (avatarUrl) {
    return (
      <img
        src={`${avatarUrl}?t=${Date.now()}`}
        alt={name || 'avatar'}
        className={`${dim} rounded-xl object-cover border border-indigo-400/30 flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center ${textSize} font-bold text-indigo-300 flex-shrink-0`}>
      {name ? getInitials(name) : '?'}
    </div>
  )
}

export default function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-slate-800">Sign Out</h3>
              </div>
              <button onClick={() => setShowLogoutModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Are you sure you want to sign out of this session?</p>
            {profile && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <AvatarThumb avatarUrl={profile.avatar_url} name={profile.full_name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">{profile.full_name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowLogoutModal(false)} disabled={loggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleLogout} disabled={loggingOut}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all disabled:opacity-60">
                <LogOut className="w-4 h-4" />
                {loggingOut ? 'Signing out...' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-16 flex items-center justify-end px-6 gap-3 flex-shrink-0 border-b border-white/5"
        style={{ background: 'linear-gradient(90deg, #1a1f38 0%, #151929 100%)' }}>

        <Link
          href="/ai-assistant"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
          bg-emerald-500/15 text-emerald-300 border border-emerald-400/30
          hover:bg-emerald-500/25 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          AI Assistant
          <span className="text-[9px] font-bold px-1.5 py-[2px] rounded-md bg-emerald-400/20 border border-emerald-400/30">
            NEW
          </span>
        </Link>

        {profile && (
          <div className="relative">
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/8 border border-transparent hover:border-white/10 transition-all"
            >
              {/* ← AVATAR FOTO / INISIAL */}
              <AvatarThumb avatarUrl={profile.avatar_url} name={profile.full_name} size="sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white/90 leading-none mb-1">{profile.full_name || 'User'}</p>
                <span className={`text-[10px] border rounded-md px-1.5 py-0.5 font-semibold inline-block ${roleBadgeColor[profile.role] || roleBadgeColor.auditee}`}>
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ml-1 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 shadow-2xl z-40 overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, #1e2340 0%, #151929 100%)' }}>

                  <div className="px-5 py-4 border-b border-white/8">
                    <div className="flex items-center gap-3">
                      {/* ← AVATAR FOTO / INISIAL DI DROPDOWN */}
                      <AvatarThumb avatarUrl={profile.avatar_url} name={profile.full_name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{profile.full_name || 'User'}</p>
                        <p className="text-xs text-white/40 truncate mt-0.5">{profile.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2 px-2">
                    <Link href="/profile" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="font-medium">My Profile</p>
                        <p className="text-xs text-white/30 mt-0.5">Edit photo & account info</p>
                      </div>
                    </Link>

                    <Link href="/settings" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="font-medium">User Management</p>
                        <p className="text-xs text-white/30 mt-0.5">Manage team members & roles</p>
                      </div>
                    </Link>
                  </div>

                  <div className="border-t border-white/8 py-2 px-2">
                    <button
                      onClick={() => { setOpen(false); setShowLogoutModal(true) }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-xs text-red-400/50 mt-0.5">Exit from this session</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}