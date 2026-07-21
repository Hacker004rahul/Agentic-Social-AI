import React, { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const PLAT_C     = { Instagram:'#e1306c', LinkedIn:'#0ea5e9', Twitter:'#000000', YouTube:'#ff0000', Facebook:'#1877f2' }
const PLAT_LABEL = { Instagram:'Instagram', LinkedIn:'LinkedIn', Twitter:'Twitter', YouTube:'YouTube', Facebook:'Facebook' }

// OAuth start URLs — backend handles the redirect to each platform
const OAUTH_PATH = {
  LinkedIn:  '/social/oauth/linkedin/start',
  Facebook:  '/social/oauth/facebook/start',
  Instagram: '/social/oauth/facebook/start',  // same Meta app, saves both
  Twitter:   '/social/oauth/x/start',
  YouTube:   '/social/oauth/youtube/start',
}

// ── Confirm Publish Modal ──────────────────────────────────
function ConfirmModal({ post, onConfirm, onCancel, loading }) {
  if (!post) return null
  const c = PLAT_C[post.platform] || 'var(--p)'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'grid', placeItems:'center', padding:20 }}>
      <div className="card" style={{ maxWidth:500, width:'100%', margin:0 }}>
        <div className="card-title" style={{ marginBottom:6 }}>Confirm Live Publish</div>
        <div className="card-sub" style={{ marginBottom:14 }}>
          The agent will call the official{' '}
          <span style={{ color:c, fontWeight:700 }}>{PLAT_LABEL[post.platform]} API</span>{' '}
          and post this content live using your connected account.
        </div>
        <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderLeft:`4px solid ${c}`, borderRadius:8, padding:'12px 14px', fontSize:'0.82rem', color:'var(--text2)', lineHeight:1.65, marginBottom:14, whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>
          {post.content}
        </div>
        <div style={{ fontSize:'0.72rem', color:'var(--amber)', marginBottom:18, padding:'8px 12px', background:'color-mix(in srgb, var(--amber) 10%, transparent)', border:'1px solid var(--amber)', borderRadius:6 }}>
          ⚠️ This will post live to your {post.platform} account. This cannot be undone.
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onConfirm} disabled={loading}>
            {loading
              ? <><span className="loading loading-spinner loading-xs" /> Agent is publishing…</>
              : `Yes, Publish to ${post.platform}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────
export default function SchedulerPanel({ scheduler }) {
  const [queue,       setQueue]       = useState(scheduler?.scheduled || [])
  const [savedCreds,  setSavedCreds]  = useState([])
  const [confirmPost, setConfirmPost] = useState(null)
  const [connecting,  setConnecting]  = useState(null)  // platform being connected
  const [publishing,  setPublishing]  = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const [toast,       setToast]       = useState(null)

  const loadCreds = useCallback(() => {
    api.get('/social/credentials').then(r => setSavedCreds(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/scheduler/queue').then(r => setQueue(r.data)).catch(() => {})
    loadCreds()
  }, [loadCreds])

  // Listen for OAuth popup postMessage
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type !== 'oauth_done') return
      setConnecting(null)
      if (e.data.status === 'success') {
        loadCreds()
        showToast(`✅ ${e.data.platform} connected successfully`)
      } else {
        showToast(`❌ ${e.data.platform} connection failed: ${e.data.error}`, false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [loadCreds])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 6000)
  }

  // Open OAuth popup for a platform
  const connectPlatform = (platform) => {
    const token = localStorage.getItem('agentic-token')
    if (!token) { showToast('Please log in first', false); return }

    // Decode user_id from JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId  = payload.sub
      const path    = OAUTH_PATH[platform]
      if (!path) return

      const url = `http://localhost:8000${path}?user_id=${userId}`
      setConnecting(platform)
      const popup = window.open(url, `connect_${platform}`, 'width=600,height=700,scrollbars=yes')

      // Fallback: poll if popup closed without postMessage
      const poll = setInterval(() => {
        if (popup?.closed) {
          clearInterval(poll)
          setConnecting(null)
          loadCreds()
        }
      }, 800)
    } catch {
      showToast('Failed to start OAuth flow', false)
    }
  }

  const handlePublishClick = (post) => {
    const hasCreds = savedCreds.some(c => c.platform === post.platform)
    if (hasCreds) {
      setConfirmPost(post)
    } else {
      connectPlatform(post.platform)
    }
  }

  const handleConfirmPublish = async () => {
    setPublishing(true)
    try {
      const { data } = await api.post('/social/publish', {
        post_id:  confirmPost.id,
        platform: confirmPost.platform,
        content:  confirmPost.content,
      })
      setQueue(q => q.map(p =>
        p.id === confirmPost.id
          ? { ...p, status: data.status, api_response: data.response, published_at: new Date().toISOString() }
          : p
      ))
      showToast(data.status === 'published' ? `✅ ${data.response}` : `❌ ${data.response}`, data.status === 'published')
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Publish failed — reconnect your account.', false)
    } finally {
      setPublishing(false)
      setConfirmPost(null)
    }
  }

  const remove = async id => {
    setDeleting(id)
    try { await api.delete(`/scheduler/queue/${id}`); setQueue(q => q.filter(p => p.id !== id)) }
    finally { setDeleting(null) }
  }

  const published = queue.filter(p => p.status === 'published')
  const scheduled = queue.filter(p => p.status === 'scheduled')

  return (
    <div>
      <ConfirmModal post={confirmPost} onConfirm={handleConfirmPublish} onCancel={() => setConfirmPost(null)} loading={publishing} />

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:2000, background: toast.ok ? 'var(--green)' : 'var(--red)', color:'#fff', padding:'11px 20px', borderRadius:10, fontWeight:700, fontSize:'0.82rem', boxShadow:'0 8px 28px rgba(0,0,0,0.25)', maxWidth:400 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div className="page-title">Scheduler</div>
        <div className="page-sub">Agent publishes live via official platform APIs. Connect your accounts once — agent handles the rest.</div>
      </div>

      {/* Connected accounts */}
      {savedCreds.length > 0 && (
        <div className="card" style={{ marginBottom:16, padding:'14px 16px' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Connected Accounts</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {savedCreds.map(c => (
              <div key={c.platform} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:999, border:`1px solid ${PLAT_C[c.platform] || 'var(--border)'}`, fontSize:'0.74rem', color: PLAT_C[c.platform] || 'var(--text2)', background:'var(--surface-2)' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:PLAT_C[c.platform], display:'inline-block' }} />
                {c.platform}
                <span style={{ opacity:0.5 }}>·</span>
                <span style={{ opacity:0.7 }}>{c.preview}</span>
                <button style={{ marginLeft:2, opacity:0.5, fontSize:'0.64rem', cursor:'pointer', background:'none', border:'none', color:'inherit', padding:0 }} onClick={() => connectPlatform(c.platform)}>
                  reconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label:'Total',     value: queue.length,     bar:'var(--blue)'  },
          { label:'Published', value: published.length, bar:'var(--green)' },
          { label:'Scheduled', value: scheduled.length, bar:'var(--text2)' },
        ].map((s, i) => (
          <div className="stat-box" key={i} style={{ '--bar-color': s.bar }}>
            <div className="stat-num" style={{ color: s.bar }}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Queue */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Post Queue</div>
          <span className="badge badge-info badge-outline">{queue.length} Items</span>
        </div>

        {queue.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">S</div>
            <div className="empty-title">Queue Is Empty</div>
            <div className="empty-sub">Run the agents to generate and queue posts.</div>
          </div>
        )}

        {queue.map((p, i) => {
          const c           = PLAT_C[p.platform] || 'var(--p)'
          const hasCreds    = savedCreds.some(s => s.platform === p.platform)
          const isPublished = p.status === 'published'
          const isConnecting = connecting === p.platform

          return (
            <div className="post-card" key={i} style={{ borderLeft:`4px solid ${c}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9, flexWrap:'wrap' }}>
                <span style={{ fontWeight:800, fontSize:'0.82rem', color: c }}>{p.platform}</span>
                <span className={`badge badge-outline ${isPublished ? 'badge-success' : 'badge-info'}`}>{p.status}</span>
                {hasCreds && !isPublished && (
                  <span className="badge badge-success badge-outline" style={{ fontSize:'0.62rem' }}>● connected</span>
                )}
                <span style={{ marginLeft:'auto', fontSize:'0.68rem', color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}>
                  {p.scheduled_at} · {p.best_time}
                </span>
              </div>

              <div style={{ fontSize:'0.82rem', color:'var(--text2)', lineHeight:1.55, marginBottom:10 }}>
                {p.content?.length > 160 ? p.content.slice(0, 160) + '…' : p.content}
              </div>

              {p.engagement && (
                <div style={{ display:'flex', gap:14, fontSize:'0.72rem', color:'var(--green)', marginBottom:10, flexWrap:'wrap' }}>
                  <span>{p.engagement.likes} Likes</span>
                  <span>{p.engagement.comments} Comments</span>
                  <span>{p.engagement.shares} Shares</span>
                  <span>{p.engagement.reach?.toLocaleString()} Reach</span>
                </div>
              )}

              {p.api_response && (
                <div style={{ fontSize:'0.76rem', padding:'7px 12px', borderRadius:6, marginBottom:10, fontWeight:600,
                  background: isPublished ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'color-mix(in srgb, var(--red) 12%, transparent)',
                  color:      isPublished ? 'var(--green)' : 'var(--red)',
                  border:    `1px solid ${isPublished ? 'var(--green)' : 'var(--red)'}`,
                }}>
                  {p.api_response}
                </div>
              )}

              {!isPublished && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handlePublishClick(p)} disabled={publishing || isConnecting}>
                    {isConnecting
                      ? <><span className="loading loading-spinner loading-xs" /> Connecting…</>
                      : hasCreds
                        ? `Publish to ${p.platform}`
                        : `Connect ${p.platform} & Publish`}
                  </button>

                  {p.platform === 'YouTube' && (
                    <button className="btn btn-secondary btn-sm" style={{ background: '#ff0000', color: '#fff', border: 'none' }} onClick={() => {
                      navigator.clipboard.writeText(p.content)
                      window.open('https://studio.youtube.com', '_blank')
                      showToast('📋 Content copied! Opening YouTube Studio Community Tab…')
                    }}>
                      Copy & Open YouTube Community
                    </button>
                  )}

                  <button className="btn btn-error btn-outline btn-sm" onClick={() => remove(p.id)} disabled={deleting === p.id}>
                    {deleting === p.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
