import React, { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const PLAT_C     = { Instagram:'#e1306c', LinkedIn:'#0ea5e9', Twitter:'#000000', YouTube:'#ff0000', Facebook:'#1877f2', Buffer:'#4b5563' }
const PLAT_LABEL = { Instagram:'Instagram', LinkedIn:'LinkedIn', Twitter:'Twitter', YouTube:'YouTube', Facebook:'Facebook', Buffer:'Buffer' }

// OAuth start URLs — backend handles the redirect to each platform
const OAUTH_PATH = {
  LinkedIn:  '/social/oauth/linkedin/start',
  Facebook:  '/social/oauth/facebook/start',
  Instagram: '/social/oauth/facebook/start',  // same Meta app, saves both
  Twitter:   '/social/oauth/x/start',
  YouTube:   '/social/oauth/youtube/start',
  Buffer:    '/social/oauth/buffer/start',
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

  // Creator state
  const [showCreateForm,    setShowCreateForm]    = useState(false)
  const [videoFile,         setVideoFile]         = useState(null)
  const [videoUrl,          setVideoUrl]          = useState('')
  const [aspectRatioValid,  setAspectRatioValid]  = useState(true)
  const [title,             setTitle]             = useState('')
  const [description,       setDescription]       = useState('')
  const [category,          setCategory]          = useState('22') // People & Blogs
  const [visibility,        setVisibility]        = useState('unlisted')
  const [license,           setLicense]           = useState('youtube')
  const [notifySubscribers, setNotifySubscribers] = useState(true)
  const [allowEmbedding,    setAllowEmbedding]    = useState(true)
  const [madeForKids,       setMadeForKids]       = useState(false)
  const [aiGenerated,       setAiGenerated]       = useState(false)
  const [scheduledAt,       setScheduledAt]       = useState('')
  const [formLoading,       setFormLoading]       = useState(false)

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

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setVideoFile(file)
    setFormLoading(true)
    
    // Check aspect ratio
    const videoUrlLocal = URL.createObjectURL(file)
    const tempVideo = document.createElement('video')
    tempVideo.src = videoUrlLocal
    tempVideo.onloadedmetadata = () => {
      const width = tempVideo.videoWidth
      const height = tempVideo.videoHeight
      const ratio = width / height
      if (ratio >= 0.5 && ratio <= 1.05) {
        setAspectRatioValid(true)
      } else {
        setAspectRatioValid(false)
      }
      URL.revokeObjectURL(videoUrlLocal)
    }

    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/social/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setVideoUrl(res.data.url)
      showToast('✅ Video uploaded successfully!')
    } catch (err) {
      showToast('❌ Failed to upload video: ' + (err.response?.data?.detail || err.message), false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleAiGeneratedToggle = async (e) => {
    const checked = e.target.checked
    setAiGenerated(checked)
    if (checked) {
      const topic = prompt('Enter a brief topic/industry for your video:')
      if (!topic) {
        setAiGenerated(false)
        return
      }
      setFormLoading(true)
      try {
        const res = await api.post('/social/generate-video-metadata', { topic })
        setTitle(res.data.title || '')
        setDescription(res.data.description || '')
        showToast('✨ AI Metadata generated!')
      } catch (err) {
        showToast('❌ AI generation failed: ' + (err.response?.data?.detail || err.message), false)
        setAiGenerated(false)
      } finally {
        setFormLoading(false)
      }
    }
  }

  const handleScheduleVideoPost = async () => {
    setFormLoading(true)
    try {
      const payload = {
        platform: 'YouTube',
        content: description,
        video_url: videoUrl,
        video_title: title,
        video_category: category,
        video_privacy: visibility,
        video_license: license,
        notify_subscribers: notifySubscribers,
        made_for_kids: madeForKids,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: 'scheduled'
      }

      const createRes = await api.post('/scheduler/queue', payload)
      const postId = createRes.data.post_id

      if (!scheduledAt) {
        const pubRes = await api.post('/social/publish', {
          post_id: postId,
          platform: 'YouTube',
          content: description,
          video_url: videoUrl,
          video_title: title,
          video_category: category,
          video_privacy: visibility,
          video_license: license,
          notify_subscribers: notifySubscribers,
          made_for_kids: madeForKids
        })
        showToast(pubRes.data.status === 'published' ? `✅ ${pubRes.data.response}` : `❌ ${pubRes.data.response}`, pubRes.data.status === 'published')
      } else {
        showToast('📅 Scheduled successfully!')
      }

      const qRes = await api.get('/scheduler/queue')
      setQueue(qRes.data)
      clearForm()
      setShowCreateForm(false)
    } catch (err) {
      showToast('❌ Failed to schedule video: ' + (err.response?.data?.detail || err.message), false)
    } finally {
      setFormLoading(false)
    }
  }

  const clearForm = () => {
    setVideoFile(null)
    setVideoUrl('')
    setAspectRatioValid(true)
    setTitle('')
    setDescription('')
    setCategory('22')
    setVisibility('unlisted')
    setLicense('youtube')
    setNotifySubscribers(true)
    setAllowEmbedding(true)
    setMadeForKids(false)
    setAiGenerated(false)
    setScheduledAt('')
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
        video_url: confirmPost.video_url,
        video_title: confirmPost.video_title,
        video_category: confirmPost.video_category,
        video_privacy: confirmPost.video_privacy,
        video_license: confirmPost.video_license,
        notify_subscribers: confirmPost.notify_subscribers,
        made_for_kids: confirmPost.made_for_kids
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

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">Scheduler</div>
          <div className="page-sub">Agent publishes live via official platform APIs. Connect your accounts once — agent handles the rest.</div>
        </div>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {showCreateForm ? '✕ Close Creator' : '➕ Create Video Post'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ display: 'inline-block', width: 24, height: 24, background: '#ff0000', borderRadius: '50%', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '24px' }}>Y</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>YouTube Video Creator (Short / Video)</div>
            <div className="badge badge-success badge-outline">Short Enabled</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left Column: Video Preview and Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div 
                style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: 12, 
                  height: 240, 
                  display: 'grid', 
                  placeItems: 'center', 
                  position: 'relative',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('video-uploader-input').click()}
              >
                {videoUrl ? (
                  <video 
                    src={`http://localhost:8000${videoUrl}`} 
                    controls 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎬</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>Click to Upload Video File</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>Supports MP4, MOV, WEBM (Max 60s for Shorts)</div>
                  </div>
                )}
                <input 
                  type="file" 
                  id="video-uploader-input" 
                  accept="video/*" 
                  style={{ display: 'none' }}
                  onChange={handleVideoUpload}
                />
              </div>

              {/* Validation warnings */}
              {videoFile && !aspectRatioValid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: '0.74rem', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, color: 'var(--amber)' }}>
                    ⚠️ Video dimensions are invalid. Aspect ratio must be between 9:16 (vertical) and 1:1 (square).
                  </div>
                </div>
              )}

              {!title && (
                <div style={{ fontSize: '0.74rem', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: 'var(--red)' }}>
                  ⚠️ Add the Video Title.
                </div>
              )}
            </div>

            {/* Right Column: Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>Video Title</label>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{title.length}/100</span>
                </div>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))} 
                  placeholder="Enter a title for your video"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>Description / Content</label>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{description.length}/5000</span>
                </div>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value.slice(0, 5000))} 
                  placeholder="Start writing or get inspired with AI templates..."
                  rows={3}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="1">Film & Animation</option>
                    <option value="10">Music</option>
                    <option value="20">Gaming</option>
                    <option value="22">People & Blogs</option>
                    <option value="28">Science & Technology</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>Visibility</label>
                  <select 
                    value={visibility} 
                    onChange={(e) => setVisibility(e.target.value)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>License</label>
                <select 
                  value={license} 
                  onChange={(e) => setLicense(e.target.value)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="youtube">Standard YouTube License</option>
                  <option value="creativeCommon">Creative Commons - Attribution</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', gap: 14, padding: '4px 0', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifySubscribers} onChange={(e) => setNotifySubscribers(e.target.checked)} className="checkbox checkbox-primary checkbox-xs" />
                  Notify Subscribers
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowEmbedding} onChange={(e) => setAllowEmbedding(e.target.checked)} className="checkbox checkbox-primary checkbox-xs" />
                  Allow Embedding
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={madeForKids} onChange={(e) => setMadeForKids(e.target.checked)} className="checkbox checkbox-primary checkbox-xs" />
                  Made for Kids
                </label>
              </div>

              {/* AI-Generated Metadata Prompt Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>AI-Generated Metadata</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text3)' }}>Autocomplete title/desc using Gemini</div>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle toggle-primary toggle-sm" 
                  checked={aiGenerated} 
                  onChange={handleAiGeneratedToggle} 
                />
              </div>

              {/* Scheduling details */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: '0.8rem', flex: 1 }}
                />
                
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={clearForm}
                  disabled={formLoading}
                >
                  Clear
                </button>
                
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleScheduleVideoPost}
                  disabled={formLoading || !videoUrl || !title}
                >
                  {formLoading ? 'Saving...' : scheduledAt ? 'Schedule Post' : 'Publish Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

              {p.image_data && (
                <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', maxWidth: 320, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img src={p.image_data} alt="Post graphic" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}

              {p.video_url && (
                <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', maxWidth: 320, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <video src={`http://localhost:8000${p.video_url}`} controls style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}

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
