'use client'

import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Upload, FileText, Image, File, Trash2, Download, Link as LinkIcon, Search, Filter, X, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import type { EvidenceFile } from '@/types/phase2'

const evidenceTypes = ['document', 'screenshot', 'policy', 'procedure', 'log', 'certificate', 'other'] as const

const typeIcons: Record<string, any> = {
  document: FileText,
  screenshot: Image,
  policy: FileText,
  procedure: FileText,
  log: File,
  certificate: File,
  other: File,
}

const typeColors: Record<string, string> = {
  document: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  screenshot: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  policy: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  procedure: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  log: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  certificate: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  other: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EvidencePage() {
  const [files, setFiles] = useState<EvidenceFile[]>([])
  const [controls, setControls] = useState<{ id: string; control_id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    control_id: '',
    description: '',
    evidence_type: 'document' as typeof evidenceTypes[number],
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    const [filesRes, controlsRes] = await Promise.all([
      supabase.from('evidence_files')
        .select('*, control:iso_controls(control_id, name)')
        .eq('organization_id', profile.organization_id)
        .order('uploaded_at', { ascending: false }),
      supabase.from('iso_controls').select('id, control_id, name').order('control_id'),
    ])

    setFiles(filesRes.data as EvidenceFile[] || [])
    setControls(controlsRes.data || [])
    setLoading(false)
  }

  async function handleUpload() {
    if (!selectedFile || !orgId) return
    setUploading(true)
    setUploadError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upload to storage
    const filePath = `${orgId}/${Date.now()}-${selectedFile.name}`
    const { error: storageError } = await supabase.storage
      .from('evidence')
      .upload(filePath, selectedFile)

    if (storageError) {
      // Storage might not be configured - save metadata only for demo
      setUploadError(`Storage error: ${storageError.message}. Note: You must create an 'evidence' storage bucket in Supabase.`)
      setUploading(false)
      return
    }

    // Save metadata
    const { error: dbError } = await supabase.from('evidence_files').insert({
      organization_id: orgId,
      control_id: uploadForm.control_id || null,
      file_name: selectedFile.name,
      file_path: filePath,
      file_size: selectedFile.size,
      file_type: selectedFile.type,
      evidence_type: uploadForm.evidence_type,
      description: uploadForm.description || null,
      uploaded_by: user.id,
    })

    if (dbError) {
      setUploadError(dbError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    setUploadSuccess(true)
    setSelectedFile(null)
    setUploadForm({ control_id: '', description: '', evidence_type: 'document' })
    setTimeout(() => { setUploadSuccess(false); setShowUpload(false) }, 2000)
    loadData()
  }

  async function handleDelete(file: EvidenceFile) {
    setDeletingId(file.id)
    const supabase = createClient()
    await supabase.storage.from('evidence').remove([file.file_path])
    await supabase.from('evidence_files').delete().eq('id', file.id)
    setDeletingId(null)
    loadData()
  }

  async function handleDownload(file: EvidenceFile) {
    const supabase = createClient()
    const { data } = await supabase.storage.from('evidence').createSignedUrl(file.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  const filtered = files.filter(f => {
    const matchSearch = !search || f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase()) ||
      (f.control as any)?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || f.evidence_type === typeFilter
    return matchSearch && matchType
  })

  const stats = {
    total: files.length,
    linked: files.filter(f => f.control_id).length,
    types: evidenceTypes.reduce((acc, t) => ({ ...acc, [t]: files.filter(f => f.evidence_type === t).length }), {} as Record<string, number>),
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Evidence Management"
        subtitle="Upload and link evidence files to ISO 27001 controls"
        actions={
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Evidence
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white tabular-nums">{stats.total}</p>
          <p className="text-xs text-slate-600 mt-1">Total Files</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.linked}</p>
          <p className="text-xs text-slate-600 mt-1">Linked to Controls</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-300 tabular-nums">{stats.total - stats.linked}</p>
          <p className="text-xs text-slate-600 mt-1">Unlinked</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-brand-400 tabular-nums">
            {files.reduce((sum, f) => sum + (f.file_size || 0), 0) > 0
              ? formatFileSize(files.reduce((sum, f) => sum + (f.file_size || 0), 0))
              : '0 B'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Total Size</p>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-2">
        {evidenceTypes.map(type => {
          const count = stats.types[type] || 0
          if (count === 0) return null
          const Icon = typeIcons[type]
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                typeFilter === type ? typeColors[type] : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
            </button>
          )
        })}
        {typeFilter !== 'all' && (
          <button onClick={() => setTypeFilter('all')} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-3 h-3" /> Clear filter
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-dark pl-10 w-full max-w-lg"
          placeholder="Search by filename, description, or control..."
        />
      </div>

      {/* File Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(file => {
            const Icon = typeIcons[file.evidence_type] || File
            const typeColor = typeColors[file.evidence_type] || typeColors.other
            const isImage = file.file_type?.startsWith('image/')
            const isPDF = file.file_type === 'application/pdf'

            return (
              <div key={file.id} className="glass rounded-xl p-5 card-hover group">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${typeColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColor}`}>
                        {file.evidence_type}
                      </span>
                      <span className="text-[11px] text-slate-600">{formatFileSize(file.file_size)}</span>
                    </div>
                  </div>
                </div>

                {file.description && (
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{file.description}</p>
                )}

                {/* Linked control */}
                {(file.control as any) ? (
                  <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-brand-500/5 border border-brand-500/15">
                    <LinkIcon className="w-3 h-3 text-brand-400 flex-shrink-0" />
                    <span className="text-[11px] text-brand-400 truncate">
                      {(file.control as any).control_id} — {(file.control as any).name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[11px] text-slate-700 italic">Not linked to a control</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700">{formatDate(file.uploaded_at)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deletingId === file.id}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === file.id
                        ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-16 text-center">
          <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">
            {search || typeFilter !== 'all' ? 'No files match your search' : 'No Evidence Files Yet'}
          </h3>
          <p className="text-slate-600 text-sm mb-5">
            {search || typeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Upload policies, screenshots, certificates, and other evidence to support your ISO 27001 audit.'}
          </p>
          {!search && typeFilter === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload First File
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowUpload(false); setSelectedFile(null) }} />
          <div className="relative w-full max-w-lg glass rounded-2xl p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Upload Evidence</h3>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null) }} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-sm text-emerald-400">File uploaded successfully!</p>
              </div>
            )}

            {uploadError && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400">{uploadError}</p>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-5 ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/10'
                  : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv,.xlsx"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-200">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Drag & drop or click to select file</p>
                  <p className="text-xs text-slate-600 mt-1">PDF, DOC, PNG, JPG, TXT, XLSX — Max 50MB</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="label-dark">Evidence Type</label>
                <select
                  value={uploadForm.evidence_type}
                  onChange={e => setUploadForm({ ...uploadForm, evidence_type: e.target.value as any })}
                  className="input-dark"
                >
                  {evidenceTypes.map(t => (
                    <option key={t} value={t} className="bg-slate-900">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-dark">Link to ISO Control (optional)</label>
                <select
                  value={uploadForm.control_id}
                  onChange={e => setUploadForm({ ...uploadForm, control_id: e.target.value })}
                  className="input-dark"
                >
                  <option value="" className="bg-slate-900">— Select control —</option>
                  {controls.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.control_id} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-dark">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="input-dark h-16 resize-none"
                  placeholder="Brief description of this evidence file..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowUpload(false); setSelectedFile(null) }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                  : <><Upload className="w-4 h-4" /> Upload File</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
