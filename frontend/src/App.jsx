import React, { useState, useEffect } from 'react'
import api from './lib/api'
import BrandForm       from './components/BrandForm'

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
    <div className="auth-shell">
      <div className="auth-card card bg-base-100" style={{ maxWidth: 520, width: '100%', padding: 28 }}>
        <div className="auth-hero">
          <div className="logo-mark">AS</div>
          <div>
            <div className="card-title launch-title">Agentic Social AI</div>
            <div className="card-sub">Secure access to the autonomous campaign workspace with a premium, intelligent workflow.</div>
          </div>
        </div>
        <div className="auth-badges">
          <span className="badge badge-outline badge-success">13 agents</span>
          <span className="badge badge-outline">Live orchestration</span>
          <span className="badge badge-outline">Atlas ready</span>
        </div>
        <div className="tabs tabs-boxed" style={{ marginBottom: 16 }}>
          <button className={`tab ${mode === 'login' ? 'tab-active' : ''}`} onClick={() => setMode('login')} type="button">Login</button>
          <button className={`tab ${mode === 'register' ? 'tab-active' : ''}`} onClick={() => setMode('register')} type="button">Register</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === 'register' && (
            <div className="field form-full">
              <label>Name</label>
              <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div className="field form-full">
            <label>Email</label>
            <input className="input input-bordered" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field form-full">
            <label>Password</label>
            <input className="input input-bordered" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <div className="alert alert-error form-full">{error}</div>}
          <button className="btn btn-primary form-full auth-submit" type="submit" disabled={loading}>
            {loading ? 'Working…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
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

const NAV = [
  { section: 'Workspace', items: [
    { id: 'input',      icon: 'D', label: 'Dashboard' },
    { id: 'content',    icon: 'C', label: 'Content' },
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
          <div className="theme-switcher" aria-label="Theme Switcher" title="Toggle Theme">
            <input 
              type="checkbox" 
              className="toggle toggle-sm"
              checked={theme === 'business'}
              onChange={(e) => setTheme(e.target.checked ? 'business' : 'corporate')}
              aria-label="Dark mode toggle"
            />
          </div>
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
