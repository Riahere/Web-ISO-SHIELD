'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Building2, Shield, Lock, Trash2, Save,
  CheckCircle2, XCircle, Clock, FolderOpen,
  ClipboardList, AlertTriangle, Eye, EyeOff, Camera,
  SendHorizonal, X, Upload, RefreshCw
} from 'lucide-react'

type UserRole = 'admin' | 'auditor' | 'auditee'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

interface Organization {
  id: string
  name: string
  sector: string
  employee_count: number | null
  created_at: string
}

interface ActivityItem {
  id: string
  type: 'asset' | 'evidence' | 'finding' | 'checklist'
  label: string
  name: string
  date: string
}

const roleBadge: Record<UserRole, { label: string; color: string }> = {
  admin:   { label: 'Admin',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  auditor: { label: 'Auditor', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  auditee: { label: 'Auditee', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const activityIcon: Record<ActivityItem['type'], React.ElementType> = {
  asset:     Shield,
  evidence:  FolderOpen,
  finding:   AlertTriangle,
  checklist: ClipboardList,
}

const activityColor: Record<ActivityItem['type'], string> = {
  asset:     'text-indigo-500 bg-indigo-50',
  evidence:  'text-blue-500 bg-blue-50',
  finding:   'text-orange-500 bg-orange-50',
  checklist: 'text-purple-500 bg-purple-50',
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatRelative(date: string) {
  if (!date) return 'Unknown'
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return formatDate(date)
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showViewPhoto, setShowViewPhoto] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const profileData = p as Profile
    setProfile(profileData)
    setFullName(profileData?.full_name || '')

    if (profileData?.organization_id) {
      const { data: o } = await supabase.from('organizations').select('*').eq('id', profileData.organization_id).single()
      setOrg(o as Organization)
    }

    const activities: ActivityItem[] = []
    
    // Fetch Assets
    const { data: assets } = await supabase.from('assets').select('id, name, created_at').eq('created_by', user.id).order('created_at', { ascending: false }).limit(3)
    assets?.forEach(a => activities.push({ id: a.id, type: 'asset', label: 'Added Asset', name: a.name, date: (a as any).created_at ?? '' }))

    // Fetch Evidence
    const { data: evidences } = await supabase.from('evidence_files').select('id, file_name, uploaded_at').eq('uploaded_by', user.id).order('uploaded_at', { ascending: false }).limit(3)
    evidences?.forEach(e => activities.push({ id: e.id, type: 'evidence', label: 'Uploaded Evidence', name: (e as any).file_name, date: (e as any).uploaded_at ?? '' }))

    // Fetch Findings
    const { data: findings } = await supabase.from('audit_findings').select('id, title, created_at').eq('created_by', user.id).order('created_at', { ascending: false }).limit(3)
    findings?.forEach(f => activities.push({ id: f.id, type: 'finding', label: 'Created Finding', name: (f as any).title, date: (f as any).created_at ?? '' }))

    // Fetch Assessments with cast to any[]
    const { data: assessments } = await supabase.from('control_assessments').select('id, notes, assessed_at').eq('assessed_by', user.id).order('assessed_at', { ascending: false }).limit(3)
    ;(assessments as any[])?.forEach(c => activities.push({ 
      id: c.id, 
      type: 'checklist', 
      label: 'ISO Control Assessment', 
      name: c.notes ? c.notes.slice(0, 40) + '...' : 'ISO Control Assessment', 
      date: c.assessed_at ?? '' 
    }))

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setActivity(activities.slice(0, 8))
    setLoading(false)
  }

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showFeedback('error', 'File size limit is 2MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleUploadAvatar() {
    if (!avatarFile || !profile) return
    setUploadingAvatar(true)
    const ext = avatarFile.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
    if (uploadError) { showFeedback('error', 'Upload failed: ' + uploadError.message); setUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    if (updateError) { showFeedback('error', 'Failed to save avatar URL.') }
    else { setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev); showFeedback('success', 'Avatar updated successfully!'); setShowAvatarModal(false); setAvatarFile(null); setAvatarPreview(null); router.refresh() }
    setUploadingAvatar(false)
  }

  async function handleRemoveAvatar() {
    if (!profile) return
    setUploadingAvatar(true)
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, avatar_url: null } : prev)
    setAvatarPreview(null); setAvatarFile(null); setShowAvatarModal(false)
    showFeedback('success', 'Avatar removed.')
    router.refresh()
    setUploadingAvatar(false)
  }

  async function handleSaveProfile() {
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (error) showFeedback('error', 'Failed to save: ' + error.message)
    else { setProfile(prev => prev ? { ...prev, full_name: fullName } : prev); showFeedback('success', 'Profile updated successfully!') }
    setSavingProfile(false)
  }

  async function handleChangePassword() {
    if (!oldPassword) { showFeedback('error', 'Please enter your current password.'); return }
    if (newPassword.length < 6) { showFeedback('error', 'New password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { showFeedback('error', 'Passwords do not match.'); return }
    setSavingPassword(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile!.email, password: oldPassword })
    if (signInError) { showFeedback('error', 'Current password is incorrect.'); setSavingPassword(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showFeedback('error', 'Failed to change password: ' + error.message)
    else { showFeedback('success', 'Password changed successfully!'); setOldPassword(''); setNewPassword(''); setConfirmPassword('') }
    setSavingPassword(false)
  }

  async function handleSendReset() {
    if (!profile) return
    setSendingReset(true)
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/auth/reset-password` })
    if (error) showFeedback('error', 'Failed to send email: ' + error.message)
    else { setResetSent(true); showFeedback('success', `Reset link sent to ${profile.email}`) }
    setSendingReset(false)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== profile?.email) { showFeedback('error', 'Email does not match.'); return }
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const avatarSrc = profile.avatar_url ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}` : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-5">
        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm
            ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
            {feedback.message}
          </div>
        )}

        {/* View Photo Modal (Facebook-style) */}
        {showViewPhoto && avatarSrc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowViewPhoto(false)}>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowViewPhoto(false)} className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
                <X className="w-5 h-5" />
              </button>
              <img
                src={avatarSrc}
                alt="Profile Photo"
                className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <p className="text-center text-white/50 text-sm mt-3">{profile.full_name || profile.email}</p>
            </div>
          </div>
        )}

        {/* Avatar Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Edit Avatar</h3>
                <button onClick={() => { setShowAvatarModal(false); setAvatarPreview(null); setAvatarFile(null) }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center">
                {(avatarPreview || avatarSrc) ? (
                  <img src={avatarPreview || avatarSrc!} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-3xl font-bold text-indigo-500">
                    {getInitials(profile.full_name, profile.email)}
                  </div>
                )}
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-5 text-center cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                <p className="text-sm text-slate-500">{avatarFile ? avatarFile.name : 'Click to select photo'}</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP — max 2MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
              <div className="flex gap-2">
                <button onClick={handleUploadAvatar} disabled={!avatarFile || uploadingAvatar}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-40">
                  {uploadingAvatar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {uploadingAvatar ? 'Uploading...' : 'Save Avatar'}
                </button>
                {avatarSrc && (
                  <button onClick={handleRemoveAvatar} disabled={uploadingAvatar} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6 shadow-sm">
          <div className="relative flex-shrink-0 group">
            {/* Klik foto → lihat besar */}
            <button
              onClick={() => avatarSrc ? setShowViewPhoto(true) : setShowAvatarModal(true)}
              className="relative block"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-100 group-hover:border-indigo-300 flex items-center justify-center text-2xl font-bold text-indigo-500 transition-colors">
                  {getInitials(profile.full_name, profile.email)}
                </div>
              )}
              {avatarSrc && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
            {/* Tombol kamera kecil di pojok → buka edit modal */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 border-2 border-white flex items-center justify-center transition-colors shadow-md"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800">{profile.full_name || '(No name set)'}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[profile.role].color}`}>
                {roleBadge[profile.role].label}
              </span>
              {org && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {org.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 flex-shrink-0">
            <p>Joined</p>
            <p className="text-slate-600 font-medium mt-0.5">{formatDate(profile.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Edit Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-slate-700">Edit Profile</h3>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Email</label>
              <input type="email" value={profile.email} disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-sm cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile || fullName === profile.full_name}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-slate-700">Change Password</h3>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Current Password</label>
              <div className="relative">
                <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Enter current password"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
                <button type="button" onClick={() => setShowOld(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
                <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Confirm New Password</label>
              <input type={showNew ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>
            <button onClick={handleChangePassword} disabled={savingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all disabled:opacity-50">
              <Lock className="w-4 h-4" />
              {savingPassword ? 'Verifying...' : 'Update Password'}
            </button>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Forgot your current password?</p>
              {resetSent ? (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Reset link sent to {profile.email}
                </div>
              ) : (
                <button onClick={handleSendReset} disabled={sendingReset}
                  className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg px-3 py-2 transition-all disabled:opacity-50 w-full justify-center">
                  {sendingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
                  {sendingReset ? 'Sending...' : 'Send Password Reset Link'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {org && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-slate-700">Organization Info</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Organization Name</p>
                <p className="text-slate-800 font-medium">{org.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Sector</p>
                <p className="text-slate-800 font-medium capitalize">{org.sector}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Employees</p>
                <p className="text-slate-800 font-medium">{org.employee_count ?? '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-slate-700">Recent Activity</h3>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((item) => {
                const Icon = activityIcon[item.type]
                return (
                  <div key={item.id + item.date} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activityColor[item.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm text-slate-700 truncate font-medium">{item.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatRelative(item.date)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No activity recorded yet.</p>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-red-600">Delete Account</h3>
              </div>
              <p className="text-xs text-slate-500">Deleted accounts cannot be recovered.</p>
            </div>
            <button onClick={() => setShowDelete(p => !p)}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-colors ml-4">
              {showDelete ? 'Cancel' : 'Delete Account'}
            </button>
          </div>
          {showDelete && (
            <div className="mt-4 pt-4 border-t border-red-100 space-y-3">
              <p className="text-sm text-slate-600">
                Type your email <span className="text-red-500 font-mono">{profile.email}</span> to confirm:
              </p>
              <input type="email" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={profile.email}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-red-200 text-slate-800 text-sm focus:outline-none focus:border-red-400" />
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== profile.email}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Trash2 className="w-4 h-4" />
                Confirm Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}