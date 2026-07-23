import React, { useState, useEffect } from 'react'
import api from '../lib/api'

export default function VideoStudioPanel() {
  const [activeTab, setActiveTab] = useState('generator') // 'generator', 'queue', 'analytics'
  const [toast, setToast] = useState(null)

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8000${url}`;
  };

  // Form inputs
  const [brandName, setBrandName] = useState('')
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('YouTube')
  const [duration, setDuration] = useState(30)
  const [mood, setMood] = useState('chill')
  const [voiceGender, setVoiceGender] = useState('female')
  const [selectedProvider, setSelectedProvider] = useState('google')

  // Status & Loaded state
  const [generating, setGenerating] = useState(false)
  const [project, setProject] = useState(null)
  const [storyboard, setStoryboard] = useState([])
  const [assets, setAssets] = useState({})
  
  // Providers & Queue & Analytics
  const [providers, setProviders] = useState([])
  const [queue, setQueue] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [actioning, setActioning] = useState(null)

  // Edit fields
  const [editingItemId, setEditingItemId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editScheduledAt, setEditScheduledAt] = useState('')

  useEffect(() => {
    loadProviders()
    loadQueue()
    loadAnalytics()
  }, [])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const loadProviders = async () => {
    try {
      const { data } = await api.get('/video/providers')
      setProviders(data.providers || [])
      setSelectedProvider(data.selected || 'google')
    } catch (err) {
      console.error(err)
    }
  }

  const loadQueue = async () => {
    setLoadingQueue(true)
    try {
      const { data } = await api.get('/video/queue')
      setQueue(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingQueue(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/video/analytics/video')
      setAnalytics(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectProvider = async (provKey) => {
    try {
      await api.post('/video/providers/select', { provider_key: provKey })
      setSelectedProvider(provKey)
      showToast(`Switched active AI Video Generator to ${provKey.toUpperCase()}`)
    } catch (err) {
      showToast('Failed to select provider', false)
    }
  }

  const handleGenerate = async (e) => {
    if (e) e.preventDefault()
    if (!content.trim()) return showToast('Please enter a caption or video idea', false)
    setGenerating(true)
    setProject(null)
    setStoryboard([])
    setAssets({})
    
    try {
      const { data } = await api.post('/video/generate', {
        brand_name: brandName || 'My Brand',
        content,
        platform,
        duration: parseInt(duration),
        mood,
        voice_gender: voiceGender
      })
      
      // Load details of the project
      const details = await api.get(`/video/${data.id}`)
      setProject(details.data.project)
      setStoryboard(details.data.storyboard)
      setAssets(details.data.assets)
      showToast('AI Video & Storyboard generated successfully!')
      loadQueue()
    } catch (err) {
      showToast('Video generation failed. Please try again.', false)
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async (projId) => {
    setActioning(projId)
    try {
      await api.post('/video/approve', { project_id: projId })
      showToast('Draft approved & placed in optimal Publishing Queue!')
      setProject(null) // clear preview after approving
      loadQueue()
    } catch (err) {
      showToast('Failed to approve draft', false)
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (projId) => {
    setActioning(projId)
    try {
      await api.post('/video/reject', { project_id: projId })
      showToast('Video draft rejected')
      setProject(null)
      loadQueue()
    } catch (err) {
      showToast('Failed to reject draft', false)
    } finally {
      setActioning(null)
    }
  }

  const handlePublishNow = async (queueId) => {
    setActioning(queueId)
    showToast('Triggering immediate official publish agent upload...')
    try {
      await api.post('/video/publish/now', { queue_id: queueId })
      showToast('Published successfully!')
      loadQueue()
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Publishing failed', false)
    } finally {
      setActioning(null)
    }
  }

  const handleEditQueue = (item) => {
    setEditingItemId(item.id)
    setEditContent(item.content)
    setEditScheduledAt(item.scheduled_at)
  }

  const handleSaveQueueItem = async (itemId) => {
    setActioning(itemId)
    try {
      await api.patch(`/video/queue/${itemId}`, {
        content: editContent,
        scheduled_at: editScheduledAt
      })
      showToast('Queue item updated successfully!')
      setEditingItemId(null)
      loadQueue()
    } catch (err) {
      showToast('Failed to update queue item', false)
    } finally {
      setActioning(null)
    }
  }

  const handleRemoveQueueItem = async (itemId) => {
    setActioning(itemId)
    try {
      await api.delete(`/video/queue/${itemId}`)
      showToast('Queue item removed')
      loadQueue()
    } catch (err) {
      showToast('Failed to remove queue item', false)
    } finally {
      setActioning(null)
    }
  }

  const handleRegenerate = async (projId) => {
    setActioning(projId)
    showToast('Regenerating video & storyboard draft...')
    try {
      const { data } = await api.post('/video/regenerate', { project_id: projId })
      const details = await api.get(`/video/${data.id}`)
      setProject(details.data.project)
      setStoryboard(details.data.storyboard)
      setAssets(details.data.assets)
      showToast('Regenerated version successfully!')
    } catch (err) {
      showToast('Regeneration failed', false)
    } finally {
      setActioning(null)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:2000, background: toast.ok ? 'var(--green)' : 'var(--red)', color:'#fff', padding:'11px 20px', borderRadius:10, fontWeight:700, fontSize:'0.82rem', boxShadow:'0 8px 28px rgba(0,0,0,0.25)' }}>
          {toast.msg}
        </div>
      )}

      {/* Main Headers */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="page-title">Video Studio</div>
          <div className="page-sub">Enterprise AI video generation, automated narration synthesis, storyboard edits, and publishing queue.</div>
        </div>
        <div className="tabs tabs-boxed" style={{ padding: 4, background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button className={`tab ${activeTab === 'generator' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generator')} style={{ borderRadius: 8, fontSize: '0.82rem', border: 'none', padding: '6px 16px', color: activeTab === 'generator' ? '#fff' : '#94a3b8' }}>🎬 AI Creator</button>
          <button className={`tab ${activeTab === 'queue' ? 'tab-active' : ''}`} onClick={() => setActiveTab('queue')} style={{ borderRadius: 8, fontSize: '0.82rem', border: 'none', padding: '6px 16px', color: activeTab === 'queue' ? '#fff' : '#94a3b8' }}>📅 Queue ({queue.length})</button>
          <button className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`} onClick={() => setActiveTab('analytics')} style={{ borderRadius: 8, fontSize: '0.82rem', border: 'none', padding: '6px 16px', color: activeTab === 'analytics' ? '#fff' : '#94a3b8' }}>📊 Video Engagement</button>
        </div>
      </div>

      {activeTab === 'generator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
          {/* Left Panel: Creator Control Panel */}
          <div className="card" style={{ padding: 20, background: 'var(--surface-2)', border: '1px solid var(--border)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚙️</span> Video Parameters
            </h3>
            
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Brand Name</label>
                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Acme SaaS" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
              </div>

              <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Video Topic / Caption Idea</label>
                <textarea rows={3} value={content} onChange={e => setContent(e.target.value)} placeholder="Describe the main hook, values or copy to transform into video scenes..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="YouTube">YouTube Shorts</option>
                    <option value="Instagram">Instagram Reels</option>
                    <option value="Facebook">Facebook Story</option>
                    <option value="LinkedIn">LinkedIn Video</option>
                    <option value="Twitter">X video</option>
                  </select>
                </div>

                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Duration</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value={10}>10 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>AI Voice Narration</label>
                  <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="female">🙋‍♀️ Female US</option>
                    <option value="male">🙋‍♂️ Male UK</option>
                  </select>
                </div>

                <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Music Mood</label>
                  <select value={mood} onChange={e => setMood(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="chill">🎵 Chill Loop</option>
                    <option value="energetic">⚡ Energetic</option>
                    <option value="corporate">💼 Corporate</option>
                    <option value="cinematic">🎥 Cinematic</option>
                  </select>
                </div>
              </div>

              <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>AI Video Engine Provider</label>
                <select value={selectedProvider} onChange={e => handleSelectProvider(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600 }}>
                  {providers.map(p => (
                    <option key={p.key} value={p.key}>{p.name} {p.active ? '(Active)' : ''}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={generating} className="btn btn-primary btn-block" style={{ marginTop: 8, padding: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                {generating ? '⏳ Generating AI Storyboard & Video...' : '🪄 Generate Video Draft'}
              </button>
            </form>
          </div>

          {/* Right Panel: Storyboard and Live Player */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {generating && (
              <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span className="loading loading-spinner loading-lg text-primary" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>Generating AI Subtitles & Scenes</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gemini is synthesizing scenes, creating custom voice voiceover narration, and layout rendering...</div>
              </div>
            )}

            {!generating && !project && (
              <div className="card" style={{ padding: 60, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Video Studio Draft Workspace</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 450, margin: '6px auto 0' }}>Define your prompt parameters on the left and run generator to preview scene storyboards, voices, subtitles, and preview animations.</div>
              </div>
            )}

            {project && (
              <div className="card animate-fade" style={{ padding: 24, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{project.brand_name} — {project.platform} Draft</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Generated using <strong>{project.provider}</strong> • Duration: {project.duration}s</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(project.id)} disabled={actioning !== null}>
                      ✔️ Approve & Queue
                    </button>
                    <button className="btn btn-neutral btn-sm" onClick={() => handleRegenerate(project.id)} disabled={actioning !== null}>
                      🔄 Regenerate
                    </button>
                    <button className="btn btn-outline btn-error btn-sm" onClick={() => handleReject(project.id)} disabled={actioning !== null}>
                      ❌ Reject
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
                  {/* Visual Video Player */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video 
                        src={resolveUrl(project.video_url)} 
                        controls 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {assets.voice_over_url && (
                      <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>🗣️ TTS Audio Narration</div>
                        <audio src={resolveUrl(assets.voice_over_url)} controls style={{ width: '100%', height: 28 }} />
                      </div>
                    )}
                  </div>

                  {/* Scene Storyboard and Subtitles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)', margin: 0 }}>📋 Scene Sequence Timeline</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 6 }}>
                      {storyboard.map((scene, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {scene.scene || idx+1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: '0.84rem' }}>{scene.heading}</span>
                              <span className="badge badge-neutral badge-xs">{scene.duration}s</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Visual:</strong> {scene.visual_description}
                            </div>
                            <div style={{ fontSize: '0.78rem', padding: '6px 8px', borderRadius: 4, background: 'var(--surface-2)', borderLeft: '3px solid var(--primary)', color: 'var(--text)' }}>
                              " {scene.narration} "
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="card" style={{ padding: 24, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>📅 Publishing Queue Manager</h3>

          {loadingQueue ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : queue.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No videos currently in publishing queue. Create and approve a video draft in the AI Creator tab.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Video</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Platform</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Caption / Description</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Scheduled Time</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ width: 44, height: 64, borderRadius: 6, overflow: 'hidden', background: '#000' }}>
                          <video src={resolveUrl(item.video_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-outline" style={{ fontSize: '0.74rem' }}>{item.platform}</span>
                      </td>
                      <td style={{ padding: '12px 8px', maxWidth: 280 }}>
                        {editingItemId === item.id ? (
                          <textarea 
                            value={editContent} 
                            onChange={e => setEditContent(e.target.value)} 
                            rows={3} 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} 
                          />
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {editingItemId === item.id ? (
                          <input 
                            type="datetime-local" 
                            value={editScheduledAt.slice(0, 16)} 
                            onChange={e => setEditScheduledAt(e.target.value)} 
                            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} 
                          />
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(item.scheduled_at).toLocaleString()}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${
                          item.status === 'published' ? 'badge-success' :
                          item.status === 'scheduled' ? 'badge-info' :
                          item.status === 'failed' ? 'badge-error' :
                          item.status === 'publishing' ? 'badge-warning' : 'badge-neutral'
                        }`} style={{ fontSize: '0.74rem' }}>
                          {item.status.toUpperCase()}
                        </span>
                        {item.retry_count > 0 && (
                          <div style={{ fontSize: '0.64rem', color: 'var(--red)', marginTop: 2 }}>Retry: {item.retry_count}/3</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {editingItemId === item.id ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-success btn-xs" onClick={() => handleSaveQueueItem(item.id)} disabled={actioning !== null}>Save</button>
                            <button className="btn btn-outline btn-xs" onClick={() => setEditingItemId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {item.status !== 'published' && (
                              <>
                                <button className="btn btn-primary btn-xs" onClick={() => handlePublishNow(item.id)} disabled={actioning !== null}>🚀 Publish</button>
                                <button className="btn btn-neutral btn-xs" onClick={() => handleEditQueue(item)}>✏️ Edit</button>
                              </>
                            )}
                            <button className="btn btn-error btn-outline btn-xs" onClick={() => handleRemoveQueueItem(item.id)} disabled={actioning !== null}>🗑️ Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Row Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div className="card" style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>🎥 TOTAL VIDEO VIEWS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>{analytics.views.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--green)', marginTop: 4 }}>📈 +14.2% engagement rate</div>
            </div>

            <div className="card" style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>⏳ WATCH TIME (HOURS)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>{analytics.watch_time_hours.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--green)', marginTop: 4 }}>📈 +8.1% vs last week</div>
            </div>

            <div className="card" style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>🎯 COMPLETION RATE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>{analytics.completion_rate}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--green)', marginTop: 4 }}>⚡ Industry top 10% benchmark</div>
            </div>

            <div className="card" style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>🖱️ IMPRESSIONS & CTR</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>{analytics.ctr}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--green)', marginTop: 4 }}>📈 {analytics.impressions.toLocaleString()} views on screen</div>
            </div>
          </div>

          {/* Graphical Representation / Table */}
          <div className="card" style={{ padding: 24, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 16 }}>📈 Historical Performance Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.history.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{row.date}</div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ fontSize: '0.8rem' }}>👀 Views: <strong>{row.views.toLocaleString()}</strong></div>
                    <div style={{ fontSize: '0.8rem' }}>🔥 Likes & Engagement: <strong>{row.engagement.toLocaleString()}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
