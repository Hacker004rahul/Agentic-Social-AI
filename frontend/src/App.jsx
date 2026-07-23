import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import api from './lib/api'
import AnalyticsPanel from './components/AnalyticsPanel'
import AutonomousPanel from './components/AutonomousPanel'
import BrandForm from './components/BrandForm'
import BrandVoicePanel from './components/BrandVoicePanel'
import CampaignPanel from './components/CampaignPanel'
import CompetitorPanel from './components/CompetitorPanel'
import ContentPanel from './components/ContentPanel'
import EngagementPanel from './components/EngagementPanel'
import HistoryPanel from './components/HistoryPanel'
import InboxPanel from './components/InboxPanel'
import PublisherPanel from './components/PublisherPanel'
import RecyclePanel from './components/RecyclePanel'
import SchedulerPanel from './components/SchedulerPanel'
import SuggestionPanel from './components/SuggestionPanel'
import WorkflowTrace from './components/WorkflowTrace'

const NAV = [
  {
    section: 'Workspace',
    items: [
      { id: 'input', icon: 'HQ', label: 'Dashboard' },
      { id: 'autonomous', icon: 'AI', label: 'Autopilot', badge: 'Active', bc: 'badge-accent' },
      { id: 'content', icon: 'CM', label: 'Content' },
    ],
  },
  {
    section: 'Publish',
    items: [
      { id: 'publisher', icon: 'PB', label: 'Publisher', badge: 'Live', bc: 'badge-success' },
      { id: 'scheduler', icon: 'SQ', label: 'Scheduler', badge: 'Queue', bc: 'badge-neutral' },
      { id: 'recycle', icon: 'EG', label: 'Evergreen', badge: 'Auto', bc: 'badge-info' },
      { id: 'inbox', icon: 'IB', label: 'Inbox', badge: 'AI', bc: 'badge-primary' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { id: 'analytics', icon: 'AN', label: 'Analytics' },
      { id: 'campaign', icon: 'CP', label: 'Campaign' },
      { id: 'suggestion', icon: 'SG', label: 'Suggestions' },
      { id: 'competitor', icon: 'CI', label: 'Competitors' },
      { id: 'voice', icon: 'BV', label: 'Brand Voice' },
      { id: 'engagement', icon: 'EN', label: 'Engagement' },
    ],
  },
  {
    section: 'System',
    items: [{ id: 'history', icon: 'HS', label: 'History' }],
  },
]

const AGENTS = [
  'StrategyAgent',
  'TrendAgent',
  'ContentAgent',
  'BrandVoiceAgent',
  'SchedulerAgent',
  'PublisherAgent',
  'AnalyticsAgent',
  'CampaignAgent',
  'EngagementAgent',
  'InboxAgent',
  'CompetitorAgent',
  'SuggestionAgent',
  'RecycleAgent',
]

const TAB_COPY = {
  input: 'Shape the brand brief, run the full AI team, and turn raw inputs into premium campaigns.',
  autonomous: 'Monitor the background agent loop and keep the system moving with less manual friction.',
  content: 'Review platform-ready copy, launch angles, and content variations in a cleaner editorial flow.',
  publisher: 'See what has gone live, what needs attention, and how the sent stream is evolving.',
  scheduler: 'Compose, connect, queue, and publish in real time with a colorful premium workflow.',
  recycle: 'Keep evergreen winners in circulation with a more visual content lane.',
  inbox: 'Handle replies, mentions, and community follow-ups in a calmer triage view.',
  analytics: 'Read the story behind performance with stronger hierarchy and more visual polish.',
  campaign: 'Review your strategy, launch arcs, and core campaign motions in one place.',
  suggestion: 'Surface next best actions, timing ideas, and content opportunities from the system.',
  competitor: 'Track competitor movement and market positioning without leaving the workspace.',
  voice: 'Keep every output aligned with a polished, memorable brand voice.',
  engagement: 'Prepare thoughtful response templates and relationship-building plays.',
  history: 'Revisit previous runs, summaries, and milestones with better continuity.',
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form
      const { data } = await api.post(endpoint, payload)
      window.localStorage.setItem('agentic-token', data.token)
      onAuthenticated(data.user)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-scene">
        <div className="auth-scene-mesh" />
        <div className="auth-scene-grid" />
        <div className="auth-scene-glow auth-scene-glow-one" />
        <div className="auth-scene-glow auth-scene-glow-two" />
      </div>
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card card"
      >
        <div className="auth-hero">
          <motion.div
            initial={{ scale: 0.84, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.08 }}
            className="logo-mark auth-logo-mark"
          >
            AS
          </motion.div>
          <div>
            <div className="card-title launch-title auth-title">Agentic Social AI</div>
            <div className="card-sub auth-subtitle">
              Build premium social campaigns with a colorful AI workspace, live publishing, and multi-agent orchestration.
            </div>
          </div>
        </div>

        <div className="auth-badges">
          <span className="badge badge-outline auth-badge-live">13 Agents active</span>
          <span className="badge badge-outline auth-badge-muted">Real-time publishing</span>
        </div>

        <div className="tabs tabs-boxed auth-tabs">
          <button
            className={`tab ${mode === 'login' ? 'tab-active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`tab ${mode === 'register' ? 'tab-active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form-grid auth-form">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="auth-name"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="field form-full"
              >
                <label>Name</label>
                <input
                  className="input input-bordered"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="field form-full">
            <label>Email</label>
            <input
              className="input input-bordered"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>

          <div className="field form-full">
            <label>Password</label>
            <input
              className="input input-bordered"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="alert alert-error form-full auth-error"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn btn-primary form-full auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : null}
            {loading ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export function Empty({
  icon = '...',
  title = 'Nothing Here Yet',
  sub = 'Run a brand brief from the dashboard and this view will fill in.',
}) {
  return (
    <div className="empty-state card bg-base-100">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('input')
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem('agentic-theme')
    if (!storedTheme || storedTheme === 'business') {
      return 'corporate'
    }
    return storedTheme
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [db, setDb] = useState(null)
  const [tickIdx, setTickIdx] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = window.localStorage.getItem('agentic-token')
    if (!token) {
      setUser(null)
      return
    }

    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => {
      window.localStorage.removeItem('agentic-token')
      setUser(null)
    })
  }, [])

  useEffect(() => {
    api.get('/analytics/db-status')
      .then(({ data }) => setDb(data?.status === 'connected' ? 'ok' : 'err'))
      .catch(() => setDb('err'))
  }, [user])

  useEffect(() => {
    window.localStorage.setItem('agentic-theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setTickIdx((index) => (index + 1) % AGENTS.length), 2200)
    return () => window.clearInterval(timer)
  }, [])

  const handleLogout = () => {
    window.localStorage.removeItem('agentic-token')
    setUser(null)
    setDb(null)
    setResult(null)
    setError('')
  }

  const handleRun = async (brand) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      await api.post('/brands', brand)
      const { data } = await api.post('/agents/run', brand)
      const payload = data?.result ? data.result : data
      setResult(payload)
      setTab('input')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Backend is not responding.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  const activeNav = NAV.flatMap((group) => group.items.map((item) => ({ ...item, section: group.section }))).find(
    (item) => item.id === tab,
  )
  const workspaceStats = [
    { label: 'Agents', value: '13', tone: 'blue' },
    { label: 'Publishing', value: result?.publisher?.published || 'Live', tone: 'green' },
    {
      label: 'Database',
      value: db === 'ok' ? 'Online' : db === 'err' ? 'Offline' : 'Checking',
      tone: db === 'ok' ? 'green' : 'amber',
    },
  ]

  return (
    <div className="app" data-theme={theme}>
      <div className="app-scene" aria-hidden="true">
        <div className="app-scene-gradient" />
        <div className="app-scene-grid" />
        <div className="app-scene-ribbon app-scene-ribbon-one" />
        <div className="app-scene-ribbon app-scene-ribbon-two" />
        <div className="app-scene-glow app-scene-glow-one" />
        <div className="app-scene-glow app-scene-glow-two" />
      </div>
      <header className="header navbar bg-base-100">
        <div className="logo">
          <div className="logo-mark">AS</div>
          <div className="logo-text">
            Agentic<span>Social</span>
          </div>
        </div>

        <div className="badge badge-outline">13 Agents</div>

        <div className={`badge badge-outline ${db === 'ok' ? 'badge-success' : 'badge-error'}`}>
          <span className={db === 'ok' ? 'pulse' : 'status-dot'} />
          {db === 'ok' ? 'Database Connected' : db === 'err' ? 'Database Offline' : 'Checking...'}
        </div>

        <div className="header-right">
          {result && (
            <>
              <div className="badge badge-success badge-outline">{result.publisher?.published || 0} Published</div>
              <div className="badge badge-info badge-outline">{result.recycle?.evergreen_pool || 0} Evergreen</div>
            </>
          )}
          <div className="user-chip">
            <div className="user-avatar">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{user?.name || user?.email || 'Workspace'}</div>
              <div className="user-role">Premium workspace</div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} type="button">
            Logout
          </button>

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
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.38 5.38 0 0 1-4.4 2.26 5.4 5.4 0 0 1-4.14-9.04A9 9 0 0 0 12 3z" />
                  </svg>
                ) : (
                  <svg
                    className="theme-icon sun-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item btn btn-ghost ${tab === item.id ? 'btn-active' : ''}`}
                  onClick={() => setTab(item.id)}
                >
                  <div className="nav-icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {item.badge && <span className={`nav-badge badge badge-xs ${item.bc}`}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="content">
          <div className="workspace-banner card">
            <div className="workspace-banner-copy">
              <span className="workspace-kicker">{activeNav?.section || 'Workspace'}</span>
              <div className="workspace-banner-title">{activeNav?.label || 'Dashboard'}</div>
              <div className="workspace-banner-sub">
                {TAB_COPY[tab] || 'A colorful, premium command center for planning, publishing, and optimizing every social touchpoint.'}
              </div>
            </div>
            <div className="workspace-banner-stats">
              {workspaceStats.map((stat) => (
                <div key={stat.label} className={`workspace-banner-stat tone-${stat.tone}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="alert alert-error error-banner">{error}</div>}

          {tab === 'input' && (
            loading ? (
              <div className="loading-wrap">
                <span className="loading loading-spinner loading-lg text-primary" />
                <div className="loading-title">Your agent team is working</div>
                <div className="loading-sub">
                  Strategy, trends, content, scheduling, publishing, inbox, and analytics are being prepared.
                </div>
              </div>
            ) : (
              <>
                {result && (
                  <>
                    <div className="alert summary-box">
                      {result.executive_summary || 'The workflow is running in the background.'}
                    </div>
                    <WorkflowTrace trace={result.workflow_trace || []} />
                  </>
                )}
                <BrandForm onSubmit={handleRun} loading={loading} />
              </>
            )
          )}

          {tab === 'autonomous' && <AutonomousPanel />}
          {tab === 'content' && (result ? <ContentPanel content={result.content} /> : <Empty icon="CM" title="No Content Yet" />)}
          {tab === 'publisher' && <PublisherPanel />}
          {tab === 'scheduler' && <SchedulerPanel scheduler={result?.scheduler} />}
          {tab === 'recycle' && (result ? <RecyclePanel recycle={result.recycle} /> : <Empty icon="EG" title="No Evergreen Ideas Yet" />)}
          {tab === 'inbox' && (result ? <InboxPanel inbox={result.inbox} /> : <Empty icon="IB" title="Inbox Is Quiet" />)}
          {tab === 'analytics' && (result ? <AnalyticsPanel analytics={result.analytics} /> : <Empty icon="AN" title="No Analytics Yet" />)}
          {tab === 'campaign' && (result ? <CampaignPanel campaign={result.campaign} /> : <Empty icon="CP" title="No Campaign Plan Yet" />)}
          {tab === 'suggestion' && (result ? <SuggestionPanel suggestions={result.suggestions} /> : <Empty icon="SG" title="No Suggestions Yet" />)}
          {tab === 'competitor' && (result ? <CompetitorPanel competitor={result.competitor} /> : <Empty icon="CI" title="No Competitor Intel Yet" />)}
          {tab === 'voice' && (result ? <BrandVoicePanel brandVoice={result.brand_voice} /> : <Empty icon="BV" title="No Brand Voice Set" />)}
          {tab === 'engagement' && (result ? <EngagementPanel engagement={result.engagement} /> : <Empty icon="EN" title="No Reply Templates Yet" />)}
          {tab === 'history' && <HistoryPanel />}
        </main>
      </div>
    </div>
  )
}
