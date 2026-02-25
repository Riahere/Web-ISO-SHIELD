'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import {
  Users, Shield, UserCheck, Mail, Calendar, Edit2, Trash2,
  UserPlus, X, Check, Link2, Copy, Clock,
  ToggleLeft, ToggleRight, RefreshCw, Search
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = 'admin' | 'auditor' | 'auditee'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  organization_id: string | null
  created_at: string | null
}

interface Invite {
  id: string
  token: string
  role: UserRole
  expires_at: string
  used_count: number
  is_active: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const roleBadge: Record<UserRole, { label: string; color: string }> = {
  admin:   { label: 'Admin',   color: 'bg-brand-100 text-brand-700 border-brand-300' },
  auditor: { label: 'Auditor', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  auditee: { label: 'Auditee', color: 'bg-slate-200 text-slate-700 border-slate-400' },
}

const roleOptions: UserRole[] = ['admin', 'auditor', 'auditee']

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const supabase = createClient()

  const [currentUser, setCurrentUser]   = useState<Profile | null>(null)
  const [members, setMembers]           = useState<Profile[]>([])
  const [unassigned, setUnassigned]     = useState<Profile[]>([])
  const [invites, setInvites]           = useState<Invite[]>([])
  const [loading, setLoading]           = useState(true)
  const [orgId, setOrgId]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [activeTab, setActiveTab]       = useState<'members' | 'invites'>('members')
  const [activeFilter, setActiveFilter] = useState<'all' | UserRole>('all')

  // Edit role inline
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editingRole, setEditingRole]   = useState<UserRole>('auditee')
  const [saving, setSaving]             = useState(false)

  // Modal: Invite Link
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newInviteRole, setNewInviteRole]     = useState<UserRole>('auditee')
  const [creatingInvite, setCreatingInvite]   = useState(false)
  const [copiedToken, setCopiedToken]         = useState<string | null>(null)

  // Modal: Assign Manual
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUser, setSelectedUser]       = useState<Profile | null>(null)
  const [assignRole, setAssignRole]           = useState<UserRole>('auditee')
  const [assigning, setAssigning]             = useState(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ─── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setCurrentUser(profile as Profile | null)

    if (profile?.organization_id) {
      setOrgId(profile.organization_id)

      const { data: teamMembers } = await supabase
        .from('profiles').select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true })
      setMembers((teamMembers || []) as Profile[])

      if (profile.role === 'admin') {
        const { data: unassignedList } = await supabase
          .from('profiles').select('*')
          .is('organization_id', null)
          .order('created_at', { ascending: false })
        setUnassigned((unassignedList || []) as Profile[])

        const { data: inviteList } = await (supabase as any)
          .from('organization_invites').select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })
        setInvites((inviteList || []) as Invite[])
      }
    }
    setLoading(false)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function updateRole(userId: string, newRole: UserRole) {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { showFeedback('error', 'Failed to update role: ' + error.message) }
    else {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
      showFeedback('success', 'Role updated successfully!')
    }
    setEditingId(null); setSaving(false)
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this user from the organization?')) return
    const { error } = await supabase
      .from('profiles').update({ organization_id: null, role: 'auditee' }).eq('id', userId)
    if (error) { showFeedback('error', 'Failed to remove: ' + error.message); return }
    setMembers(prev => prev.filter(m => m.id !== userId))
    showFeedback('success', 'Member removed from organization.')
    await loadData()
  }

  async function handleCreateInvite() {
    if (!orgId) return
    setCreatingInvite(true)
    const { error } = await (supabase as any).from('organization_invites').insert({
      organization_id: orgId,
      role: newInviteRole,
      created_by: currentUser?.id,
    })
    if (error) { showFeedback('error', 'Gagal membuat link: ' + error.message) }
    else {
      showFeedback('success', 'Invite link berhasil dibuat!')
      await loadData()
      setActiveTab('invites')
    }
    setCreatingInvite(false); setShowInviteModal(false)
  }

  async function copyInviteLink(token: string) {
    const url = `${window.location.origin}/auth/register?invite=${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function toggleInvite(invite: Invite) {
    await (supabase as any).from('organization_invites')
      .update({ is_active: !invite.is_active }).eq('id', invite.id)
    setInvites(prev => prev.map(i => i.id === invite.id ? { ...i, is_active: !i.is_active } : i))
  }

  async function deleteInvite(id: string) {
    await (supabase as any).from('organization_invites').delete().eq('id', id)
    setInvites(prev => prev.filter(i => i.id !== id))
    showFeedback('success', 'Invite link dihapus.')
  }

  async function handleAssignUser() {
    if (!selectedUser || !orgId) return
    setAssigning(true)
    const { error } = await supabase
      .from('profiles').update({ organization_id: orgId, role: assignRole }).eq('id', selectedUser.id)
    if (error) { showFeedback('error', error.message) }
    else {
      showFeedback('success', `${selectedUser.full_name || selectedUser.email} berhasil ditambahkan!`)
      setShowAssignModal(false); setSelectedUser(null)
      await loadData()
    }
    setAssigning(false)
  }

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3500)
  }

  const isAdmin = currentUser?.role === 'admin'

  const stats = {
    total:   members.length,
    admin:   members.filter(m => m.role === 'admin').length,
    auditor: members.filter(m => m.role === 'auditor').length,
    auditee: members.filter(m => m.role === 'auditee').length,
  }

  const filteredMembers = members
    .filter(m => activeFilter === 'all' || m.role === activeFilter)
    .filter(m =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    )

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="glass rounded-xl p-16 text-center">
        <p className="text-slate-500 text-sm animate-pulse">Loading users...</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="User Management"
        subtitle={`${stats.total} members in the organization`}
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Assign User
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white/90 text-sm font-medium transition-all"
              >
                <Link2 className="w-4 h-4" />
                Invite Link
              </button>
            </div>
          ) : null
        }
      />

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border
          ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Total',   value: stats.total,   icon: Users,     color: 'text-slate-700',  filter: 'all'     as const, ring: 'ring-slate-400'  },
          { label: 'Admin',   value: stats.admin,   icon: Shield,    color: 'text-brand-600',  filter: 'admin'   as const, ring: 'ring-brand-400'  },
          { label: 'Auditor', value: stats.auditor, icon: UserCheck, color: 'text-purple-600', filter: 'auditor' as const, ring: 'ring-purple-400' },
          { label: 'Auditee', value: stats.auditee, icon: Users,     color: 'text-slate-500',  filter: 'auditee' as const, ring: 'ring-slate-300'  },
        ] as const).map(({ label, value, icon: Icon, color, filter, ring }) => {
          const isActive = activeFilter === filter
          return (
            <button
              key={label}
              onClick={() => {
                setActiveFilter(isActive && filter !== 'all' ? 'all' : filter)
                setActiveTab('members')
              }}
              className={[
                'glass rounded-xl p-4 text-center w-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
                isActive ? `ring-2 ${ring} shadow-md -translate-y-0.5 bg-white` : 'hover:bg-white/60'
              ].join(' ')}
            >
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${color} tabular-nums`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              {isActive && filter !== 'all' && (
                <p className="text-[10px] text-brand-400 mt-1 font-medium">● filtering</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'members' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'invites' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Invite Links
            {invites.filter(i => i.is_active).length > 0 && (
              <span className="bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {invites.filter(i => i.is_active).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm glass rounded-lg border border-slate-200 focus:outline-none focus:border-brand-400"
              />
            </div>
            {activeFilter !== 'all' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm flex-shrink-0">
                <span className="text-brand-700 capitalize font-medium">{activeFilter}s</span>
                <span className="text-brand-400">({members.filter(m => m.role === activeFilter).length})</span>
                <button onClick={() => setActiveFilter('all')} className="text-brand-400 hover:text-brand-600 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {filteredMembers.length > 0 ? (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                    {isAdmin && <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-sm font-semibold text-brand-700 flex-shrink-0">
                            {getInitials(member.full_name, member.email)}
                          </div>
                          <p className="font-medium text-slate-800">
                            {member.full_name || '(No Name)'}
                            {member.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-brand-500 font-normal">(You)</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {member.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === member.id ? (
                          <select
                            value={editingRole}
                            onChange={e => setEditingRole(e.target.value as UserRole)}
                            className="px-2 py-1 rounded bg-white border border-brand-400 text-slate-800 text-xs focus:outline-none"
                            autoFocus
                          >
                            {roleOptions.map(r => (
                              <option key={r} value={r}>{roleBadge[r].label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadge[member.role].color}`}>
                            {roleBadge[member.role].label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          {member.created_at ? formatDate(member.created_at) : '—'}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {editingId === member.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => updateRole(member.id, editingRole)} disabled={saving}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all disabled:opacity-50">
                                Save
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-all">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {member.id !== currentUser?.id && (
                                <>
                                  <button onClick={() => { setEditingId(member.id); setEditingRole(member.role) }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Change Role">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => removeMember(member.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Remove from Organization">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass rounded-xl p-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              {activeFilter !== 'all' ? (
                <>
                  <h3 className="text-lg font-semibold text-slate-500 mb-2">
                    No {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}s Found
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    There are no users with the <span className="font-medium capitalize">{activeFilter}</span> role.
                  </p>
                  <button onClick={() => setActiveFilter('all')}
                    className="text-sm text-brand-500 hover:text-brand-600 underline">
                    Show all members
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-slate-500 mb-2">No Members Found</h3>
                  <p className="text-slate-400 text-sm">Try a different search or invite new members.</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Tab: Invite Links */}
      {activeTab === 'invites' && isAdmin && (
        <div className="glass rounded-xl overflow-hidden">
          {invites.length === 0 ? (
            <div className="p-16 text-center">
              <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-500 mb-2">No Invite Links</h3>
              <p className="text-slate-400 text-sm mb-4">Buat invite link untuk mengundang anggota baru dengan mudah.</p>
              <button onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all">
                Buat Invite Link
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invites.map(invite => {
                const expired = new Date(invite.expires_at) < new Date()
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?invite=${invite.token}`
                return (
                  <div key={invite.id} className={`px-6 py-4 flex items-center gap-4 ${!invite.is_active || expired ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge[invite.role].color}`}>
                          {roleBadge[invite.role].label}
                        </span>
                        {expired && <span className="text-xs text-red-500 font-medium">Expired</span>}
                        {!invite.is_active && !expired && <span className="text-xs text-slate-400">Nonaktif</span>}
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">{url}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Exp: {formatDate(invite.expires_at)}</span>
                        <span>Digunakan: {invite.used_count}×</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => copyInviteLink(invite.token)} disabled={!invite.is_active || expired}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-xs text-slate-600 hover:text-brand-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {copiedToken === invite.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button onClick={() => toggleInvite(invite)} title={invite.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
                        {invite.is_active ? <ToggleRight className="w-4 h-4 text-brand-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteInvite(invite.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Role legend */}
      <div className="mt-6 glass rounded-xl p-4">
        <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Role Descriptions</p>
        <div className="grid grid-cols-3 gap-4 text-xs text-slate-500">
          {[
            { role: 'admin'   as UserRole, desc: 'Full access: manage users, edit all data, view all features.' },
            { role: 'auditor' as UserRole, desc: 'Can create findings, audit reports, and ISO checklists.' },
            { role: 'auditee' as UserRole, desc: 'Read-only access. Can upload evidence and view dashboard.' },
          ].map(({ role, desc }) => (
            <div key={role}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${roleBadge[role].color}`}>
                {roleBadge[role].label}
              </span>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Buat Invite Link */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Buat Invite Link</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Bagikan link ini ke user yang ingin bergabung. Mereka cukup register lewat link tersebut dan langsung masuk ke organisasi kamu.
            </p>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-2 block">Role untuk user yang diundang</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map(r => (
                  <button key={r} onClick={() => setNewInviteRole(r)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      newInviteRole === r
                        ? `${roleBadge[r].color} ring-2 ring-brand-300`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {roleBadge[r].label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200 mb-4">
              ⏰ Link berlaku <strong>7 hari</strong>, bisa digunakan unlimited kali. Bisa dinonaktifkan kapan saja.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Batal
              </button>
              <button onClick={handleCreateInvite} disabled={creatingInvite}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50">
                {creatingInvite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {creatingInvite ? 'Membuat...' : 'Buat Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign User Manual */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Assign User ke Organisasi</h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedUser(null) }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Pilih user yang sudah register tapi belum tergabung di organisasi manapun, lalu tentukan role-nya.
            </p>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-2 block">User tersedia ({unassigned.length})</label>
              {unassigned.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                  Tidak ada user yang menunggu untuk di-assign.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-2">
                  {unassigned.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedUser?.id === u.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}>
                      <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-sm font-semibold text-brand-700 flex-shrink-0">
                        {getInitials(u.full_name, u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{u.full_name || '(No Name)'}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      {selectedUser?.id === u.id && <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-2 block">Role untuk {selectedUser.full_name || selectedUser.email}</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(r => (
                    <button key={r} onClick={() => setAssignRole(r)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        assignRole === r ? `${roleBadge[r].color} ring-2 ring-brand-300` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {roleBadge[r].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAssignModal(false); setSelectedUser(null) }}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Batal
              </button>
              <button onClick={handleAssignUser} disabled={!selectedUser || assigning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-40">
                {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {assigning ? 'Menambahkan...' : 'Tambahkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}