'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot, Send, User, Sparkles, Shield,
  AlertTriangle, BookOpen, Lightbulb,
  RefreshCw, Copy, Check, Trash2, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types/phase3'


const QUICK_PROMPTS = [
  { icon: Shield,        label: 'Privileged Access (A.9.2.3)',   prompt: 'Explain ISO 27001 control A.9.2.3 (Management of Privileged Access Rights) and give me a practical implementation checklist.' },
  { icon: AlertTriangle, label: 'OWASP Top 10 priorities',       prompt: 'What are the top 5 OWASP 2021 risks I should prioritize for a web application, and what are the most effective mitigations for each?' },
  { icon: BookOpen,      label: 'Common certification failures', prompt: 'What are the most common reasons organizations fail ISO 27001 certification audits, and how can I avoid them?' },
  { icon: Lightbulb,     label: 'Risk treatment strategies',     prompt: 'Explain the four ISO 27001 risk treatment options (mitigate, accept, transfer, avoid) with real-world examples for each.' },
  { icon: Shield,        label: 'Scope definition best practice', prompt: 'How should I define the ISMS scope for an organization with hybrid on-premise and cloud infrastructure? What should and shouldn\'t be included?' },
  { icon: AlertTriangle, label: 'SQL Injection full remediation', prompt: 'Provide a comprehensive remediation plan for SQL Injection (OWASP A03:2021) including detection, intermediate fixes, long-term controls, and developer training.' },
  { icon: BookOpen,      label: 'SoA document guide',            prompt: 'What is a Statement of Applicability in ISO 27001, how do I write one, and what are the common mistakes to avoid?' },
  { icon: Lightbulb,     label: 'Incident response plan',        prompt: 'Help me create an outline for an ISO 27001-compliant Information Security Incident Response Plan (A.16.1.1).' },
]


function renderMarkdown(text: string): JSX.Element[] {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-white mt-4 mb-1.5 first:mt-0">{line.slice(3)}</h3>)
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-xs font-bold text-slate-300 mt-3 mb-1">{line.slice(4)}</h4>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-800/80 px-1 py-0.5 rounded text-brand-300 text-[11px] font-mono">$1</code>')
      elements.push(<div key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-brand-400 flex-shrink-0 mt-0.5 text-xs">•</span><span dangerouslySetInnerHTML={{ __html: content }} /></div>)
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1]
      const content = line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-800/80 px-1 py-0.5 rounded text-brand-300 text-[11px] font-mono">$1</code>')
      elements.push(<div key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-brand-400 flex-shrink-0 font-mono text-xs w-5 mt-0.5 text-right">{num}.</span><span dangerouslySetInnerHTML={{ __html: content }} /></div>)
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-2 border-brand-500/40 pl-3 text-sm text-slate-400 italic my-1">{line.slice(2)}</blockquote>)
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(<pre key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto my-2">{codeLines.join('\n')}</pre>)
    } else if (line === '') {
      elements.push(<div key={i} className="h-1.5" />)
    } else if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**')) {
      elements.push(<p key={i} className="text-sm font-semibold text-slate-200 mt-2">{line.slice(2,-2)}</p>)
    } else {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-800/80 px-1 py-0.5 rounded text-brand-300 text-[11px] font-mono">$1</code>').replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>')
      elements.push(<p key={i} className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />)
    }
    i++
  }
  return elements
}


function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-brand-600/30 border border-brand-500/30' : 'bg-emerald-600/20 border border-emerald-500/30'}`}>
        {isUser ? <User className="w-4 h-4 text-brand-400" /> : <Bot className="w-4 h-4 text-emerald-400" />}
      </div>
      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-brand-600/25 border border-brand-500/30 rounded-tr-sm' : 'bg-slate-800/60 border border-slate-700/60 rounded-tl-sm'}`}>
          {isUser
            ? <p className="text-sm text-slate-200 leading-relaxed">{message.content}</p>
            : <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          }
        </div>
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span 
            className="text-[10px] text-slate-700"
            suppressHydrationWarning
          >
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {!isUser && (
            <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:text-slate-400">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-600/20 border border-emerald-500/30 flex-shrink-0">
        <Bot className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i*0.15}s`, animationDuration: '0.8s' }} />)}
        </div>
      </div>
    </div>
  )
}


const WELCOME: ChatMessage = {
  role: 'assistant',
  content: `## Welcome to ISO Shield AI 🛡️

I'm your intelligent ISO 27001 security audit assistant powered by **Llama 3.1 70B** on **Groq**, with full RAG context from your organization's audit data.

I can help you with:
- **ISO 27001 Annex A controls** — explanations, implementation guidance, and evidence requirements
- **OWASP vulnerability analysis** — root cause, business impact, and remediation steps
- **Risk treatment strategies** — mitigate, accept, transfer, avoid with real examples
- **Compliance gap analysis** — interpreting your checklist scores and prioritizing actions
- **Audit preparation** — documentation, SoA, ISMS scope, and certification tips

Pick a quick prompt below or ask me anything.`,
  timestamp: new Date().toISOString(),
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [orgContext, setOrgContext] = useState<any>(null)
  const [contextLoaded, setContextLoaded] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadContext() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function loadContext() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setContextLoaded(true); return }
    const orgId = profile.organization_id

    const [orgRes, assetsRes, risksRes, findingsRes, complianceRes] = await Promise.all([
      supabase.from('organizations').select('id, name, sector, exposure_level, risk_appetite').eq('id', orgId).single(),
      supabase.from('assets').select('criticality').eq('organization_id', orgId).eq('is_active', true),
      supabase.from('asset_vulnerabilities').select('risk_level').eq('organization_id', orgId),
      supabase.from('audit_findings').select('status, severity').eq('organization_id', orgId),
      supabase.from('control_assessments').select('status').eq('organization_id', orgId),
    ])
    const { data: totalCtrl } = await supabase.from('iso_controls').select('id')
    const assessments = complianceRes.data || []
    const compliant = assessments.filter(c => c.status === 'compliant').length
    const partial = assessments.filter(c => c.status === 'partial').length
    const na = assessments.filter(c => c.status === 'not_applicable').length
    const eff = (totalCtrl?.length || 0) - na
    const score = eff > 0 ? Math.round(((compliant + partial * 0.5) / eff) * 100) : 0
    const allFindings = findingsRes.data || []
    const allRisks = risksRes.data || []

    setOrgContext({
      orgId: orgRes.data?.id, 
      orgName: orgRes.data?.name,
      sector: orgRes.data?.sector,
      exposureLevel: orgRes.data?.exposure_level,
      riskAppetite: orgRes.data?.risk_appetite,
      totalAssets: (assetsRes.data || []).length,
      criticalAssets: (assetsRes.data || []).filter(a => a.criticality === 'critical').length,
      complianceScore: score,
      assessedControls: assessments.length,
      totalControls: totalCtrl?.length || 0,
      criticalRisks: allRisks.filter(r => r.risk_level === 'critical').length,
      highRisks: allRisks.filter(r => r.risk_level === 'high').length,
      openFindings: allFindings.filter(f => f.status === 'open').length,
      totalFindings: allFindings.length,
      nonCompliantControls: assessments.filter(c => c.status === 'non_compliant').length,
    })
    setContextLoaded(true)
  }

  async function sendMessage(text?: string) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    setShowPrompts(false)
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: orgContext, 
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: new Date().toISOString() }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**System Error:** ${err.message}\n\nPlease check your HuggingFace Router endpoint and Groq API keys in your environment variables.`,
        timestamp: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function clearChat() {
    setMessages([WELCOME])
    setShowPrompts(true)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">ISO Shield AI</h1>
            <p className="text-xs text-slate-500">Groq-Accelerated Audit Expert</p>
          </div>
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Llama 3.1 70B Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orgContext && contextLoaded && (
            <div className="hidden lg:flex items-center gap-2">
              {[
                { label: `${orgContext.totalAssets} assets`, color: 'text-slate-400' },
                { label: `${orgContext.complianceScore}% compliant`, color: orgContext.complianceScore >= 70 ? 'text-emerald-400' : orgContext.complianceScore >= 40 ? 'text-yellow-400' : 'text-red-400' },
                { label: `${orgContext.openFindings} findings open`, color: orgContext.openFindings > 0 ? 'text-orange-400' : 'text-slate-400' },
                { label: `${orgContext.criticalRisks} critical risks`, color: orgContext.criticalRisks > 0 ? 'text-red-400' : 'text-slate-400' },
              ].map(({ label, color }) => (
                <span key={label} className={`text-xs px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 ${color}`}>{label}</span>
              ))}
            </div>
          )}
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300 text-xs transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {showPrompts && messages.length <= 1 && (
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/50 bg-[#0a0f1e]">
          <p className="text-xs text-slate-600 mb-3 font-medium">Quick start — click to ask:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button key={label} onClick={() => sendMessage(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/30 hover:bg-brand-500/5 text-slate-400 hover:text-slate-300 text-xs transition-all">
                <Icon className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-slate-800 bg-[#0a0f1e]">
        {!showPrompts && messages.length > 2 && (
          <button onClick={() => setShowPrompts(true)} className="mb-2 flex items-center gap-1 text-xs text-slate-700 hover:text-slate-500 transition-colors">
            <ChevronDown className="w-3 h-3 rotate-180" /> Show quick prompts
          </button>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about ISO 27001 controls, OWASP vulnerabilities, risk treatment..."
              rows={1}
              disabled={loading}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 resize-none transition-all leading-relaxed"
              style={{ minHeight: 48, maxHeight: 140 }}
            />
          </div>
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-2 text-center">
          Powered by Llama 3.1 70B via Groq · HuggingFace MiniLM Embeddings · Multi-tenant Isolation Enabled · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}