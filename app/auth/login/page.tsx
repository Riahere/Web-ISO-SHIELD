'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .lg-root {
    min-height: 100vh;
    background: #04060f;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }
  .lg-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .lg-blob1 {
    width: 600px; height: 600px;
    top: -150px; left: -150px;
    background: radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%);
    animation: lg-blob1 12s ease-in-out infinite;
  }
  .lg-blob2 {
    width: 500px; height: 500px;
    bottom: -100px; right: -100px;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    animation: lg-blob2 15s ease-in-out infinite;
  }
  .lg-blob3 {
    width: 350px; height: 350px;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
    animation: lg-blob3 18s ease-in-out infinite;
  }
  .lg-scanlines {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 1;
    background-image: repeating-linear-gradient(
      to bottom, transparent 0px, transparent 3px,
      rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px
    );
  }
  .lg-wrap {
    position: relative; z-index: 10;
    width: 100%; max-width: 440px;
    animation: lg-slideup 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }
  .lg-logo-area { text-align: center; margin-bottom: 2rem; }
  .lg-logo-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 60px; height: 60px; border-radius: 18px;
    background: linear-gradient(135deg, rgba(109,40,217,0.3), rgba(59,130,246,0.2));
    border: 1px solid rgba(139,92,246,0.4);
    margin-bottom: 1rem;
    box-shadow: 0 0 30px rgba(109,40,217,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .lg-logo-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff 30%, rgba(139,92,246,0.9));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lg-logo-sub {
    font-size: 0.78rem; color: rgba(148,163,184,0.6);
    letter-spacing: 0.12em; text-transform: uppercase; margin-top: 0.3rem;
  }
  .lg-card {
    background: rgba(13,17,33,0.88);
    border: 1px solid rgba(139,92,246,0.15);
    border-radius: 20px; padding: 2.5rem;
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 24px 64px rgba(0,0,0,0.55),
      0 0 80px rgba(109,40,217,0.08);
    position: relative; overflow: hidden;
  }
  .lg-card-shimmer {
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent);
  }
  .lg-corner-tl {
    position: absolute; top: 12px; left: 12px;
    width: 16px; height: 16px;
    border-top: 1.5px solid rgba(139,92,246,0.45);
    border-left: 1.5px solid rgba(139,92,246,0.45);
    border-radius: 2px 0 0 0;
  }
  .lg-corner-br {
    position: absolute; bottom: 12px; right: 12px;
    width: 16px; height: 16px;
    border-bottom: 1.5px solid rgba(139,92,246,0.45);
    border-right: 1.5px solid rgba(139,92,246,0.45);
    border-radius: 0 0 2px 0;
  }
  .lg-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.3rem;
  }
  .lg-card-sub {
    font-size: 0.85rem; color: rgba(148,163,184,0.55); margin-bottom: 1.75rem;
  }
  .lg-error {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px; margin-bottom: 1.25rem;
    animation: lg-shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both;
  }
  .lg-error-text { font-size: 0.82rem; color: #f87171; }
  .lg-field { margin-bottom: 1.1rem; }
  .lg-label {
    display: block; font-size: 0.72rem; font-weight: 500;
    color: rgba(148,163,184,0.65); margin-bottom: 0.45rem;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .lg-input-wrap { position: relative; }
  .lg-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: rgba(148,163,184,0.35); pointer-events: none;
  }
  .lg-input {
    width: 100%; padding: 0.8rem 1rem 0.8rem 2.75rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; color: #f1f5f9;
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    outline: none; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .lg-input::placeholder { color: rgba(148,163,184,0.3); }
  .lg-input:focus {
    border-color: rgba(139,92,246,0.5);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
    background: rgba(139,92,246,0.05);
  }
  .lg-input:hover:not(:focus) {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
  }
  .lg-input-pr { padding-right: 2.75rem; }
  .lg-eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: rgba(148,163,184,0.4); display: flex; padding: 0;
    transition: color 0.2s;
  }
  .lg-eye-btn:hover { color: rgba(148,163,184,0.9); }
  .lg-row {
    display: flex; align-items: center; justify-content: space-between;
    margin: 0.9rem 0 1.5rem;
  }
  .lg-check-label {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.82rem; color: rgba(148,163,184,0.6);
    cursor: pointer; user-select: none;
  }
  .lg-check-label input[type='checkbox'] {
    width: 14px; height: 14px; accent-color: #7c3aed; cursor: pointer;
  }
  .lg-forgot {
    font-size: 0.82rem; color: rgba(139,92,246,0.8); text-decoration: none;
    transition: color 0.2s;
  }
  .lg-forgot:hover { color: #a78bfa; }
  .lg-btn {
    width: 100%; padding: 0.875rem 1rem; border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    color: #fff; font-family: 'Syne', sans-serif;
    font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    position: relative; overflow: hidden;
  }
  .lg-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(124,58,237,0.5), 0 0 0 1px rgba(255,255,255,0.1);
  }
  .lg-btn:active:not(:disabled) { transform: translateY(0); }
  .lg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .lg-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff; border-radius: 50%;
    animation: lg-spin 0.7s linear infinite;
  }
  .lg-divider {
    border: none; border-top: 1px solid rgba(255,255,255,0.06);
    margin: 1.5rem 0 1.25rem;
  }
  .lg-register-row {
    text-align: center; font-size: 0.84rem; color: rgba(148,163,184,0.5);
  }
  .lg-register-link {
    color: #a78bfa; text-decoration: none; font-weight: 500;
    transition: color 0.2s;
  }
  .lg-register-link:hover { color: #c4b5fd; }
  .lg-demo {
    margin-top: 1rem;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 0.75rem 1rem; text-align: center;
  }
  .lg-demo-text {
    font-size: 0.73rem; color: rgba(148,163,184,0.3); letter-spacing: 0.02em;
  }
  @keyframes lg-slideup {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lg-blob1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(40px,30px) scale(1.05); }
    66%     { transform: translate(-20px,50px) scale(0.95); }
  }
  @keyframes lg-blob2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(-50px,-30px) scale(1.08); }
    66%     { transform: translate(30px,-50px) scale(0.92); }
  }
  @keyframes lg-blob3 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    50%     { transform: translate(-50%,-50%) scale(1.15); }
  }
  @keyframes lg-shake {
    10%,90%     { transform: translateX(-2px); }
    20%,80%     { transform: translateX(4px); }
    30%,50%,70% { transform: translateX(-4px); }
    40%,60%     { transform: translateX(4px); }
  }
  @keyframes lg-spin { to { transform: rotate(360deg); } }
  @media (max-width: 480px) {
    .lg-card { padding: 1.75rem 1.5rem; }
    .lg-logo-title { font-size: 1.5rem; }
  }
`

function ClientStyles() {
  useEffect(() => {
    const id = 'lg-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = CSS
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
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    type Node = { x: number; y: number; vx: number; vy: number; r: number; a: number }
    const nodes: Node[] = Array.from({ length: Math.floor((W * H) / 18000) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1, a: Math.random() * 0.5 + 0.2,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 160) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 160) * 0.15})`
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${n.a})`
        ctx.fill()
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
        g.addColorStop(0, `rgba(139,92,246,${n.a * 0.3})`)
        g.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
      animId = requestAnimationFrame(tick)
    }
    tick()

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const msg = searchParams.get('error')
    if (msg) setError(decodeURIComponent(msg))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'The email or password you entered is incorrect.'
            : authError.message
        )
        setLoading(false)
        return
      }
      router.refresh()
      setTimeout(() => router.push(redirectTo), 100)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#04060f' }} />
  }

  return (
    <>
      <ClientStyles />

      <div className="lg-root">
        <div className="lg-blob lg-blob1" />
        <div className="lg-blob lg-blob2" />
        <div className="lg-blob lg-blob3" />
        <div className="lg-scanlines" />
        <CyberBackground />

        <div className="lg-wrap">
          <div className="lg-logo-area">
            <div className="lg-logo-icon">
              <Shield size={28} color="#a78bfa" />
            </div>
            <div className="lg-logo-title">ISO Shield</div>
            <div className="lg-logo-sub">Risk &amp; Audit Platform</div>
          </div>

          <div className="lg-card">
            <div className="lg-card-shimmer" />
            <div className="lg-corner-tl" />
            <div className="lg-corner-br" />

            <div className="lg-card-title">Sign in to your account</div>
            <div className="lg-card-sub">Enter your credentials to continue</div>

            {error && (
              <div className="lg-error">
                <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span className="lg-error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lg-field">
                <label className="lg-label">Email address</label>
                <div className="lg-input-wrap">
                  <Mail size={15} className="lg-input-icon" />
                  <input
                    type="email" value={email} required
                    placeholder="auditor@company.com"
                    className="lg-input"
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="lg-field">
                <label className="lg-label">Password</label>
                <div className="lg-input-wrap">
                  <Lock size={15} className="lg-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} required
                    placeholder="••••••••"
                    className="lg-input lg-input-pr"
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lg-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="lg-row">
                <label className="lg-check-label">
                  <input type="checkbox" />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="lg-forgot">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="lg-btn">
                {loading ? (
                  <>
                    <div className="lg-spinner" />
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            <hr className="lg-divider" />
            <div className="lg-register-row">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="lg-register-link">
                Create one
              </Link>
            </div>
          </div>

          <div className="lg-demo">
            <span className="lg-demo-text">
              Demo: Register a new account or use your Supabase credentials
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#04060f' }} />}>
      <LoginContent />
    </Suspense>
  )
}