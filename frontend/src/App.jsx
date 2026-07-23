import React, { useState, useEffect } from 'react'
import api from './lib/api'
import BrandForm       from './components/BrandForm'

import { motion, AnimatePresence } from 'framer-motion'

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form
      const { data } = await api.post(endpoint, payload)
      localStorage.setItem('agentic-token', data.token)
      onAuthenticated(data.user)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Glowing Background Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '45vw', height: '45vw',
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card card" 
        style={{ 
          maxWidth: 460, 
          width: '100%', 
          padding: '36px 32px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(24px)'
        }}
      >
        <div className="auth-hero" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="logo-mark" 
            style={{ width: 44, height: 44, borderRadius: 12, fontSize: '0.95rem' }}
          >
            AS
          </motion.div>
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="card-title launch-title" 
              style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Agentic Social AI
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="card-sub"
              style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4, marginTop: 4 }}
            >
              Launch campaign flows using autonomous multi-agent pipelines.
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="auth-badges" 
          style={{ marginBottom: 24, gap: 6 }}
        >
          <span className="badge badge-outline" style={{ borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399', background: 'rgba(52, 211, 153, 0.05)', fontWeight: 600, fontSize: '0.74rem' }}>13 Agents active</span>
          <span className="badge badge-outline" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontSize: '0.74rem' }}>Live stream pipeline</span>
        </motion.div>

        {/* Tab Switcher */}
        <div className="tabs tabs-boxed" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button 
            className={`tab ${mode === 'login' ? 'tab-active' : ''}`} 
            style={{ 
              borderRadius: 8, 
              fontSize: '0.86rem', 
              fontWeight: 600, 
              background: mode === 'login' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: mode === 'login' ? '#fff' : '#94a3b8',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setMode('login')} 
            type="button"
          >
            Login
          </button>
          <button 
            className={`tab ${mode === 'register' ? 'tab-active' : ''}`} 
            style={{ 
              borderRadius: 8, 
              fontSize: '0.86rem', 
              fontWeight: 600, 
              background: mode === 'register' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: mode === 'register' ? '#fff' : '#94a3b8',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setMode('register')} 
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div 
                key="name-field"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="field form-full"
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>Name</label>
                <input 
                  className="input input-bordered" 
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: 10, padding: '10px 14px' }}
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="field form-full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>Email</label>
            <input 
              className="input input-bordered" 
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: 10, padding: '10px 14px' }}
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>

          <div className="field form-full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>Password</label>
            <input 
              className="input input-bordered" 
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: 10, padding: '10px 14px' }}
              type="password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required 
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="alert alert-error form-full"
                style={{ fontSize: '0.8rem', padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.01, boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)' }}
            whileTap={{ scale: 0.99 }}
            className="btn btn-primary form-full auth-submit" 
            style={{ width: '100%', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', padding: '12px', background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', marginTop: 8 }}
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
import WorkflowTrace   from './components/WorkflowTrace'
import ContentPanel    from './components/ContentPanel'
import AnalyticsPanel  from './components/AnalyticsPanel'
import CampaignPanel   from './components/CampaignPanel'
import EngagementPanel from './components/EngagementPanel'
import SuggestionPanel from './components/SuggestionPanel'
import CompetitorPanel from './components/CompetitorPanel'
import BrandVoicePanel from './components/BrandVoicePanel'
import SchedulerPanel  from './components/SchedulerPanel'
import InboxPanel      from './components/InboxPanel'
import RecyclePanel    from './components/RecyclePanel'
import PublisherPanel  from './components/PublisherPanel'
import HistoryPanel    from './components/HistoryPanel'
import AutonomousPanel from './components/AutonomousPanel'
import VideoStudioPanel from './components/VideoStudioPanel'

const NAV = [
  { section: 'Workspace', items: [
    { id: 'input',      icon: 'D', label: 'Dashboard' },
    { id: 'autonomous', icon: '🤖', label: 'Autopilot', badge: 'Active', bc: 'badge-accent' },
    { id: 'content',    icon: 'C', label: 'Content' },
    { id: 'video_studio', icon: '🎬', label: 'Video Studio', badge: 'AI', bc: 'badge-secondary' },
  ]},
  { section: 'Publish', items: [
    { id: 'publisher',  icon: 'P', label: 'Publisher', badge: 'Live',  bc: 'badge-success' },
    { id: 'scheduler',  icon: 'S', label: 'Scheduler', badge: 'Queue', bc: 'badge-neutral' },
    { id: 'recycle',    icon: 'R', label: 'Evergreen', badge: 'Auto',  bc: 'badge-info' },
    { id: 'inbox',      icon: 'I', label: 'Inbox',     badge: 'AI',    bc: 'badge-primary' },
  ]},
  { section: 'Intelligence', items: [
    { id: 'analytics',  icon: 'A', label: 'Analytics' },
    { id: 'campaign',   icon: 'M', label: 'Campaign' },
    { id: 'suggestion', icon: 'T', label: 'Suggestions' },
    { id: 'competitor', icon: 'K', label: 'Competitors' },
    { id: 'voice',      icon: 'V', label: 'Brand Voice' },
    { id: 'engagement', icon: 'E', label: 'Engagement' },
  ]},
  { section: 'System', items: [
    { id: 'history',    icon: 'H', label: 'History' },
  ]},
]

const AGENTS = ['StrategyAgent','TrendAgent','ContentAgent','BrandVoiceAgent','SchedulerAgent','PublisherAgent','AnalyticsAgent','CampaignAgent','EngagementAgent','InboxAgent','CompetitorAgent','SuggestionAgent','RecycleAgent']

export function Empty({ icon = '...', title = 'Nothing Here Yet', sub = 'Run A Brand Brief From The Dashboard And This View Will Fill In.' }) {
  return (
    <div className="empty-state card bg-base-100">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  )
}

export default function App() {
  const [tab,      setTab]      = useState('input')
  const [theme,    setTheme]    = useState(() => localStorage.getItem('agentic-theme') || 'corporate')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [db,       setDb]       = useState(null)
  const [tickIdx,  setTickIdx]  = useState(0)
  const [user,     setUser]     = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('agentic-token')
    if (!token) {
      setUser(null)
      return
    }

    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => {
      localStorage.removeItem('agentic-token')
      setUser(null)
    })
  }, [])

  useEffect(() => {
    api.get('/analytics/db-status')
      .then(({ data }) => setDb(data?.status === 'connected' ? 'ok' : 'err'))
      .catch(() => setDb('err'))
  }, [user])

  useEffect(() => {
    localStorage.setItem('agentic-theme', theme)
  }, [theme])

  const handleLogout = () => {
    localStorage.removeItem('agentic-token')
    setUser(null)
    setDb(null)
    setResult(null)
    setError('')
  }

  useEffect(() => {
    const t = setInterval(() => setTickIdx(i => (i + 1) % AGENTS.length), 2200)
    return () => clearInterval(t)
  }, [])

  const handleRun = async (brand) => {
    setLoading(true); setError(''); setResult(null)
    try {
      // First save the brand profile to the database so autopilot daemon sees it
      await api.post('/brands', brand)
      const { data } = await api.post('/agents/run', brand)
      const payload = data?.result ? data.result : data
      setResult(payload)
      setTab('input')
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Backend is not responding.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="header navbar bg-base-100">
        <div className="logo">
          <div className="logo-mark">AS</div>
          <div className="logo-text">Agentic<span>Social</span></div>
        </div>

        <div className="badge badge-outline">13 Agents</div>

        <div className={`badge badge-outline ${db === 'ok' ? 'badge-success' : 'badge-error'}`}>
          <span className={db === 'ok' ? 'pulse' : 'status-dot'} />
          {db === 'ok' ? 'MongoDB Connected' : db === 'err' ? 'Database Offline' : 'Checking...'}
        </div>

        <div className="header-right">
          {result && <>
            <div className="badge badge-success badge-outline">{result.publisher?.published || 0} Published</div>
            <div className="badge badge-info badge-outline">{result.recycle?.evergreen_pool || 0} Evergreen</div>
          </>}
          {user && (
            <div className="user-chip">
              <div className="user-avatar">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</div>
              <div className="user-meta">
                <div className="user-name">{user?.name || user?.email || 'Workspace'}</div>
                <div className="user-role">Premium workspace</div>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} type="button">Logout</button>
          <button 
            type="button"
            className={`theme-toggle-btn ${theme === 'business' ? 'dark' : 'light'}`}
            onClick={() => setTheme(theme === 'business' ? 'corporate' : 'business')}
            aria-label="Toggle Theme"
            title={theme === 'business' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="theme-toggle-track">
              <div className="theme-toggle-thumb">
                {theme === 'business' ? (
                  <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.38 5.38 0 0 1-4.4 2.26 5.4 5.4 0 0 1-4.14-9.04A9 9 0 0 0 12 3z"/>
                  </svg>
                ) : (
                  <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
              </div>
            </div>
          </button>
          <div className="agent-ticker">
            <span className="ticker-dot" />
            {AGENTS[tickIdx]}
          </div>
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
          {NAV.map(g => (
            <div key={g.section}>
              <div className="sidebar-section">{g.section}</div>
              {g.items.map(item => (
                <button key={item.id} className={`nav-item btn btn-ghost ${tab === item.id ? 'btn-active' : ''}`} onClick={() => setTab(item.id)}>
                  <div className="nav-icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {item.badge && <span className={`nav-badge badge badge-xs ${item.bc}`}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="content">
          {error && <div className="alert alert-error error-banner">{error}</div>}

          {tab === 'input' && (
            loading ? (
              <div className="loading-wrap">
                <span className="loading loading-spinner loading-lg text-primary" />
                <div className="loading-title">Your Agent Team Is Working</div>
                <div className="loading-sub">Strategy, Trends, Content, Scheduling, Publishing, Inbox, And Analytics Are Being Prepared.</div>
              </div>
            ) : (
              <>
                {result && (
                  <>
                    <div className="alert summary-box">{result.executive_summary || 'The workflow is running in the background.'}</div>
                    <WorkflowTrace trace={result.workflow_trace || []} />
                  </>
                )}
                <BrandForm onSubmit={handleRun} loading={loading} />
              </>
            )
          )}

          {tab === 'autonomous' && <AutonomousPanel />}
          {tab === 'video_studio' && <VideoStudioPanel />}
          {tab === 'content'    && (result ? <ContentPanel    content={result.content}        /> : <Empty icon="C" title="No Content Yet" />)}
          {tab === 'publisher'  && (result ? <PublisherPanel  publisher={result.publisher}    /> : <Empty icon="P" title="Nothing Published Yet"/>)}
          {tab === 'scheduler'  && (result ? <SchedulerPanel  scheduler={result.scheduler}    /> : <Empty icon="S" title="The Queue Is Empty" />)}
          {tab === 'recycle'    && (result ? <RecyclePanel    recycle={result.recycle}         /> : <Empty icon="R" title="No Evergreen Ideas Yet"/>)}
          {tab === 'inbox'      && (result ? <InboxPanel      inbox={result.inbox}             /> : <Empty icon="I" title="Inbox Is Quiet" />)}
          {tab === 'analytics'  && (result ? <AnalyticsPanel  analytics={result.analytics}    /> : <Empty icon="A" title="No Analytics Yet"/>)}
          {tab === 'campaign'   && (result ? <CampaignPanel   campaign={result.campaign}       /> : <Empty icon="M" title="No Campaign Plan Yet" />)}
          {tab === 'suggestion' && (result ? <SuggestionPanel suggestions={result.suggestions} /> : <Empty icon="T" title="No Suggestions Yet" />)}
          {tab === 'competitor' && (result ? <CompetitorPanel competitor={result.competitor}   /> : <Empty icon="K" title="No Competitor Intel Yet" />)}
          {tab === 'voice'      && (result ? <BrandVoicePanel brandVoice={result.brand_voice}  /> : <Empty icon="V" title="No Brand Voice Set" />)}
          {tab === 'engagement' && (result ? <EngagementPanel engagement={result.engagement}   /> : <Empty icon="E" title="No Reply Templates Yet" />)}
          {tab === 'history'    && <HistoryPanel />}
        </main>
      </div>
    </div>
  )
}
