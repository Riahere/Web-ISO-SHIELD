'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-200 flex items-center justify-center mb-3 shadow-sm">
          <Shield className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">ISO Shield</h1>
        <p className="text-sm text-slate-600 mt-0.5">ISO 27001 Risk & Audit Platform</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
        {!sent ? (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Reset your password</h2>
            <p className="text-sm text-slate-600 mb-6">Enter your email and we'll send you a reset link.</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-sm text-slate-600 mb-1">We sent a reset link to</p>
            <p className="text-sm font-semibold text-indigo-600 mb-6">{email}</p>
            <p className="text-xs text-slate-500">Didn't receive it? Check your spam folder or try again.</p>
            <button onClick={() => { setSent(false); setEmail('') }}
              className="mt-4 text-xs text-indigo-600 hover:text-indigo-500 underline transition-colors">
              Try a different email
            </button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-200 flex justify-center">
          <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}