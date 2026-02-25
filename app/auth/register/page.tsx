'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
  .rg-root { min-height:100vh; background:#04060f; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; padding:1rem; position:relative; overflow:hidden; }
  .rg-blob { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:0; }
  .rg-blob1 { width:600px; height:600px; top:-150px; left:-150px; background:radial-gradient(circle,rgba(109,40,217,.18) 0%,transparent 70%); animation:rg-blob1 12s ease-in-out infinite; }
  .rg-blob2 { width:500px; height:500px; bottom:-100px; right:-100px; background:radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%); animation:rg-blob2 15s ease-in-out infinite; }
  .rg-blob3 { width:350px; height:350px; top:50%; left:50%; transform:translate(-50%,-50%); background:radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 70%); animation:rg-blob3 18s ease-in-out infinite; }
  .rg-scanlines { position:fixed; inset:0; pointer-events:none; z-index:1; background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,.025) 3px,rgba(0,0,0,.025) 4px); }
  .rg-wrap { position:relative; z-index:10; width:100%; max-width:440px; animation:rg-slideup .7s cubic-bezier(.16,1,.3,1) both; padding:1rem 0; }
  .rg-logo-area { text-align:center; margin-bottom:1.5rem; }
  .rg-logo-icon { display:inline-flex; align-items:center; justify-content:center; width:60px; height:60px; border-radius:18px; background:linear-gradient(135deg,rgba(109,40,217,.3),rgba(59,130,246,.2)); border:1px solid rgba(139,92,246,.4); margin-bottom:1rem; box-shadow:0 0 30px rgba(109,40,217,.3),inset 0 1px 0 rgba(255,255,255,.1); }
  .rg-logo-title { font-family:'Syne',sans-serif; font-size:1.75rem; font-weight:800; letter-spacing:-.03em; background:linear-gradient(135deg,#fff 30%,rgba(139,92,246,.9)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .rg-logo-sub { font-size:.78rem; color:rgba(148,163,184,.6); letter-spacing:.12em; text-transform:uppercase; margin-top:.3rem; }
  .rg-card { background:rgba(13,17,33,.88); border:1px solid rgba(139,92,246,.15); border-radius:20px; padding:2rem 2.5rem; backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); box-shadow:0 0 0 1px rgba(255,255,255,.04),0 24px 64px rgba(0,0,0,.55),0 0 80px rgba(109,40,217,.08); position:relative; overflow:hidden; }
  .rg-card-shimmer { position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(139,92,246,.5),transparent); }
  .rg-corner-tl { position:absolute; top:12px; left:12px; width:16px; height:16px; border-top:1.5px solid rgba(139,92,246,.45); border-left:1.5px solid rgba(139,92,246,.45); border-radius:2px 0 0 0; }
  .rg-corner-br { position:absolute; bottom:12px; right:12px; width:16px; height:16px; border-bottom:1.5px solid rgba(139,92,246,.45); border-right:1.5px solid rgba(139,92,246,.45); border-radius:0 0 2px 0; }
  .rg-card-title { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:700; color:#f1f5f9; margin-bottom:.3rem; }
  .rg-card-sub { font-size:.85rem; color:rgba(148,163,184,.55); margin-bottom:1.5rem; }
  .rg-invite-banner { display:flex; align-items:center; gap:.75rem; padding:.875rem 1rem; border-radius:10px; margin-bottom:1.25rem; background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.3); }
  .rg-invite-text { font-size:.82rem; color:#a78bfa; }
  .rg-invite-org { font-weight:600; color:#c4b5fd; }
  .rg-alert { display:flex; align-items:flex-start; gap:.75rem; padding:.875rem 1rem; border-radius:10px; margin-bottom:1.25rem; }
  .rg-alert-error { background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.25); animation:rg-shake .4s cubic-bezier(.36,.07,.19,.97) both; }
  .rg-alert-success { background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25); }
  .rg-alert-error-text { font-size:.82rem; color:#f87171; }
  .rg-alert-success-text { font-size:.82rem; color:#34d399; }
  .rg-field { margin-bottom:1rem; }
  .rg-label { display:block; font-size:.72rem; font-weight:500; color:rgba(148,163,184,.65); margin-bottom:.45rem; letter-spacing:.06em; text-transform:uppercase; }
  .rg-input-wrap { position:relative; }
  .rg-input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(148,163,184,.35); pointer-events:none; }
  .rg-input { width:100%; padding:.8rem 1rem .8rem 2.75rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; color:#f1f5f9; font-family:'DM Sans',sans-serif; font-size:.9rem; outline:none; box-sizing:border-box; transition:border-color .2s,box-shadow .2s,background .2s; }
  .rg-input::placeholder { color:rgba(148,163,184,.3); }
  .rg-input:focus { border-color:rgba(139,92,246,.5); box-shadow:0 0 0 3px rgba(139,92,246,.12); background:rgba(139,92,246,.05); }
  .rg-input:hover:not(:focus) { border-color:rgba(255,255,255,.14); background:rgba(255,255,255,.06); }
  .rg-input-pr { padding-right:2.75rem; }
  .rg-eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(148,163,184,.4); display:flex; padding:0; transition:color .2s; }
  .rg-eye-btn:hover { color:rgba(148,163,184,.9); }
  .rg-strength-bar { display:flex; gap:4px; margin-top:8px; align-items:center; }
  .rg-strength-seg { flex:1; height:3px; border-radius:2px; background:rgba(255,255,255,.08); transition:background .3s; }
  .rg-strength-label { font-size:.7rem; color:rgba(148,163,184,.5); margin-left:6px; white-space:nowrap; }
  .rg-btn { width:100%; padding:.875rem 1rem; border-radius:10px; border:none; background:linear-gradient(135deg,#7c3aed,#6366f1); color:#fff; font-family:'Syne',sans-serif; font-size:.95rem; font-weight:600; letter-spacing:.02em; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; margin-top:.5rem; transition:transform .2s,box-shadow .2s,opacity .2s; box-shadow:0 4px 20px rgba(124,58,237,.35); }
  .rg-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 30px rgba(124,58,237,.5),0 0 0 1px rgba(255,255,255,.1); }
  .rg-btn:active:not(:disabled) { transform:translateY(0); }
  .rg-btn:disabled { opacity:.5; cursor:not-allowed; }
  .rg-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; border-radius:50%; animation:rg-spin .7s linear infinite; }
  .rg-divider { border:none; border-top:1px solid rgba(255,255,255,.06); margin:1.25rem 0 1rem; }
  .rg-login-row { text-align:center; font-size:.84rem; color:rgba(148,163,184,.5); }
  .rg-login-link { color:#a78bfa; text-decoration:none; font-weight:500; transition:color .2s; }
  .rg-login-link:hover { color:#c4b5fd; }
  @keyframes rg-slideup { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rg-blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,30px) scale(1.05)} 66%{transform:translate(-20px,50px) scale(.95)} }
  @keyframes rg-blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,-30px) scale(1.08)} 66%{transform:translate(30px,-50px) scale(.92)} }
  @keyframes rg-blob3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }
  @keyframes rg-shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }
  @keyframes rg-spin { to{transform:rotate(360deg)} }
  @media (max-width:480px) { .rg-card{padding:1.75rem 1.5rem} .rg-logo-title{font-size:1.5rem} }
`

function ClientStyles() {
  useEffect(() => {
    const id = 'rg-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
    return () => { document.getElementById(id)?.remove() }
  }, [])
  return null
}

function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    type Node = { x:number; y:number; vx:number; vy:number; r:number; a:number }
    const nodes: Node[] = Array.from({ length: Math.floor((W * H) / 18000) }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
      r: Math.random()*2+1, a: Math.random()*.5+.2,
    }))
    const tick = () => {
      ctx.clearRect(0,0,W,H)
      for (const n of nodes) { n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>W)n.vx*=-1; if(n.y<0||n.y>H)n.vy*=-1 }
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy)
        if(d<160){ctx.beginPath();ctx.strokeStyle=`rgba(99,102,241,${(1-d/160)*.15})`;ctx.lineWidth=.8;ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke()}
      }
      for (const n of nodes) {
        ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle=`rgba(139,92,246,${n.a})`;ctx.fill()
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*4)
        g.addColorStop(0,`rgba(139,92,246,${n.a*.3})`);g.addColorStop(1,'transparent')
        ctx.beginPath();ctx.arc(n.x,n.y,n.r*4,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
      }
      animId=requestAnimationFrame(tick)
    }
    tick()
    const onResize = () => { W=window.innerWidth;H=window.innerHeight;canvas.width=W;canvas.height=H }
    window.addEventListener('resize',onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize',onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />
}

const strengthMeta = [
  { label:'', color:'' },
  { label:'Weak', color:'#ef4444' },
  { label:'Fair', color:'#f97316' },
  { label:'Good', color:'#eab308' },
  { label:'Strong', color:'#22c55e' },
]

type InviteData = {
  organization_id: string
  role: string
  organizations: { name: string }
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [form, setForm] = useState({ full_name:'', email:'', password:'', confirm:'' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!inviteToken) return
    async function validateInvite() {
      setInviteLoading(true)
      const supabase = createClient()
      const { data, error } = await (supabase as any)
        .from('organization_invites')
        .select('organization_id, role, organizations(name)')
        .eq('token', inviteToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        setInviteError('Link undangan tidak valid atau sudah kadaluarsa.')
      } else {
        setInviteData(data as unknown as InviteData)
      }
      setInviteLoading(false)
    }
    validateInvite()
  }, [inviteToken])

  const passwordStrength = (p: string) => {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }
  const strength = passwordStrength(form.password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError(null)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.user) { setError('Gagal membuat akun.'); setLoading(false); return }

    if (inviteToken && inviteData) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: inviteData.organization_id,
          role: inviteData.role as 'admin' | 'auditor' | 'auditee',
        })
        .eq('id', data.user.id)

      if (!profileError) {
        await (supabase as any)
          .from('organization_invites')
          .update({ used_count: (inviteData as any).used_count + 1 })
          .eq('token', inviteToken)
      }
    }

    setSuccess(true)
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1500)
  }

  if (!mounted) return <div style={{ minHeight:'100vh', background:'#04060f' }} />

  return (
    <>
      <ClientStyles />
      <div className="rg-root">
        <div className="rg-blob rg-blob1" />
        <div className="rg-blob rg-blob2" />
        <div className="rg-blob rg-blob3" />
        <div className="rg-scanlines" />
        <CyberBackground />

        <div className="rg-wrap">
          <div className="rg-logo-area">
            <div className="rg-logo-icon"><Shield size={28} color="#a78bfa" /></div>
            <div className="rg-logo-title">ISO Shield</div>
            <div className="rg-logo-sub">Risk &amp; Audit Platform</div>
          </div>

          <div className="rg-card">
            <div className="rg-card-shimmer" />
            <div className="rg-corner-tl" />
            <div className="rg-corner-br" />

            <div className="rg-card-title">Create your account</div>
            <div className="rg-card-sub">
              {inviteData
                ? `Kamu diundang untuk bergabung sebagai ${inviteData.role}`
                : 'Start your ISO 27001 audit journey'}
            </div>

            {inviteLoading && (
              <div className="rg-invite-banner">
                <div className="rg-spinner" style={{ borderColor:'rgba(139,92,246,.3)', borderTopColor:'#a78bfa' }} />
                <span className="rg-invite-text">Memvalidasi link undangan...</span>
              </div>
            )}

            {inviteData && !inviteLoading && (
              <div className="rg-invite-banner">
                <CheckCircle size={16} color="#a78bfa" style={{ flexShrink:0 }} />
                <span className="rg-invite-text">
                  Bergabung ke organisasi{' '}
                  <span className="rg-invite-org">{inviteData.organizations.name}</span>
                  {' '}sebagai <span className="rg-invite-org">{inviteData.role}</span>
                </span>
              </div>
            )}

            {inviteError && (
              <div className="rg-alert rg-alert-error">
                <AlertCircle size={16} color="#f87171" style={{ flexShrink:0, marginTop:1 }} />
                <span className="rg-alert-error-text">{inviteError}</span>
              </div>
            )}

            {success && (
              <div className="rg-alert rg-alert-success">
                <CheckCircle size={16} color="#34d399" style={{ flexShrink:0, marginTop:1 }} />
                <span className="rg-alert-success-text">Akun berhasil dibuat! Mengalihkan...</span>
              </div>
            )}

            {error && (
              <div className="rg-alert rg-alert-error">
                <AlertCircle size={16} color="#f87171" style={{ flexShrink:0, marginTop:1 }} />
                <span className="rg-alert-error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="rg-field">
                <label className="rg-label">Full name</label>
                <div className="rg-input-wrap">
                  <User size={15} className="rg-input-icon" />
                  <input type="text" value={form.full_name} required placeholder="John Doe"
                    className="rg-input" onChange={e => setForm({...form, full_name:e.target.value})} />
                </div>
              </div>

              <div className="rg-field">
                <label className="rg-label">Email address</label>
                <div className="rg-input-wrap">
                  <Mail size={15} className="rg-input-icon" />
                  <input type="email" value={form.email} required placeholder="you@company.com"
                    className="rg-input" onChange={e => setForm({...form, email:e.target.value})} />
                </div>
              </div>

              <div className="rg-field">
                <label className="rg-label">Password</label>
                <div className="rg-input-wrap">
                  <Lock size={15} className="rg-input-icon" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} required
                    minLength={8} placeholder="Min. 8 characters" className="rg-input rg-input-pr"
                    onChange={e => setForm({...form, password:e.target.value})} />
                  <button type="button" className="rg-eye-btn" onClick={() => setShowPassword(v=>!v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="rg-strength-bar">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rg-strength-seg"
                        style={{ background: i<=strength ? strengthMeta[strength].color : undefined }} />
                    ))}
                    <span className="rg-strength-label" style={{ color:strengthMeta[strength].color }}>
                      {strengthMeta[strength].label}
                    </span>
                  </div>
                )}
              </div>

              <div className="rg-field">
                <label className="rg-label">Confirm password</label>
                <div className="rg-input-wrap">
                  <Lock size={15} className="rg-input-icon" />
                  <input type="password" value={form.confirm} required placeholder="Repeat password"
                    className="rg-input" onChange={e => setForm({...form, confirm:e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={loading || success || inviteLoading} className="rg-btn">
                {loading ? <><div className="rg-spinner" />Creating account...</> : 'Create account'}
              </button>
            </form>

            <hr className="rg-divider" />
            <div className="rg-login-row">
              Already have an account?{' '}
              <Link href="/auth/login" className="rg-login-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#04060f' }} />}>
      <RegisterContent />
    </Suspense>
  )
}