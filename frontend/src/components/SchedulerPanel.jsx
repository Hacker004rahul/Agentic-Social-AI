import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import api from '../lib/api'
import {
  OAUTH_PATH,
  PLATFORM_META,
  PLATFORM_ORDER,
  buildAssetUrl,
  buildBackendUrl,
  formatClock,
  formatDayLabel,
  formatRelativeTime,
  getPostPreview,
  groupPostsByDay,
  parseDateLike,
} from '../lib/publishing'

const INITIAL_COMPOSER = {
  title: '',
  content: '',
  scheduledAt: '',
  mediaUrl: '',
  mediaKind: '',
  videoTitle: '',
  videoCategory: '22',
  videoPrivacy: 'unlisted',
  videoLicense: 'youtube',
  notifySubscribers: true,
  madeForKids: false,
}

const STATUS_COPY = {
  scheduled: 'Scheduled',
  publishing: 'Publishing',
  published: 'Published',
  failed: 'Needs Attention',
}

function decodeJwtPayload(token) {
  const chunk = token.split('.')[1]
  const normalized = chunk.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(window.atob(normalized))
}

function toLocalDatetimeString(date) {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
}

function sortByFreshness(items) {
  return [...items].sort((left, right) => {
    const leftDate = parseDateLike(left.published_at || left.scheduled_at || left.created_at)?.getTime() || 0
    const rightDate = parseDateLike(right.published_at || right.scheduled_at || right.created_at)?.getTime() || 0
    return rightDate - leftDate
  })
}

function statusTone(status) {
  if (status === 'published') return 'is-success'
  if (status === 'failed') return 'is-danger'
  if (status === 'publishing') return 'is-warning'
  return 'is-info'
}

function composerHasContent(composer) {
  return Boolean(
    composer.title.trim() ||
      composer.content.trim() ||
      composer.mediaUrl ||
      composer.videoTitle.trim() ||
      composer.scheduledAt,
  )
}

function buildMetricRow(post) {
  const engagement = post.engagement || {}
  return [
    { label: 'Reactions', value: engagement.likes ?? 0 },
    { label: 'Comments', value: engagement.comments ?? 0 },
    { label: 'Shares', value: engagement.shares ?? 0 },
    { label: 'Reach', value: engagement.reach ?? 0 },
  ]
}

function QueueCard({
  post,
  platformPreview,
  busyId,
  deletingId,
  onCopy,
  onDelete,
  onPublish,
  onEditDraft,
}) {
  const meta = PLATFORM_META[post.platform] || PLATFORM_META.LinkedIn
  const preview = getPostPreview(post)
  const metrics = buildMetricRow(post)
  const isDraft = post.status === 'draft'
  const isPublished = post.status === 'published'
  const timestamp = isPublished ? post.published_at : post.scheduled_at || post.created_at

  return (
    <div className="publish-card-frame" style={{ '--platform-color': meta.color, '--platform-glow': meta.accent }}>
      <div className="publish-card-shell">
        <div className="publish-card-head">
          <div className="publish-card-account">
            <div className="publish-account-badge" style={{ background: meta.surface, color: meta.color }}>
              {meta.short}
            </div>
            <div>
              <div className="publish-card-name">{post.platform} Studio</div>
              <div className="publish-card-note">
                {isDraft
                  ? 'Draft preview'
                  : isPublished
                    ? `Sent ${formatRelativeTime(post.published_at)}`
                    : `${STATUS_COPY[post.status] || post.status} for ${formatRelativeTime(timestamp)}`}
                {platformPreview ? ` · ${platformPreview}` : ''}
              </div>
            </div>
          </div>
          <div className={`publish-status-pill ${statusTone(post.status)}`}>
            {STATUS_COPY[post.status] || post.status}
          </div>
        </div>

        {post.title && <div className="publish-card-title">{post.title}</div>}
        <div className="publish-card-copy">{post.content || 'Media-first post ready to send.'}</div>

        {preview && (
          <div className="publish-card-media">
            {preview.kind === 'video' ? (
              <video controls src={buildAssetUrl(preview.url)} />
            ) : (
              <img src={buildAssetUrl(preview.url)} alt="Post preview" />
            )}
          </div>
        )}

        {post.api_response && (
          <div className={`publish-response-strip ${isPublished ? 'is-success' : 'is-danger'}`}>
            {post.api_response}
          </div>
        )}

        <div className="publish-metric-row">
          {metrics.map((metric) => (
            <div key={metric.label} className="publish-metric-cell">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className="publish-card-footer">
          <div className="publish-card-stamp">
            {isDraft
              ? 'Ready to keep editing'
              : isPublished
                ? `Delivered ${formatRelativeTime(post.published_at)}`
                : `Scheduled for ${formatDayLabel(timestamp)} at ${formatClock(timestamp)}`}
          </div>
          <div className="publish-card-actions">
            <button type="button" className="publish-ghost-btn" onClick={() => onCopy(post.content || post.title || '')}>
              Copy
            </button>
            {isDraft ? (
              <button type="button" className="publish-primary-btn" onClick={onEditDraft}>
                Continue editing
              </button>
            ) : !isPublished ? (
              <button
                type="button"
                className="publish-primary-btn"
                onClick={() => onPublish(post)}
                disabled={busyId === post.id}
              >
                {busyId === post.id ? 'Publishing...' : post.status === 'failed' ? 'Retry now' : 'Publish now'}
              </button>
            ) : null}
            {!isDraft && (
              <button
                type="button"
                className="publish-danger-btn"
                onClick={() => onDelete(post.id)}
                disabled={deletingId === post.id}
              >
                {deletingId === post.id ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SchedulerPanel({ scheduler }) {
  const [queue, setQueue] = useState(scheduler?.scheduled || [])
  const [savedCreds, setSavedCreds] = useState([])
  const [activePlatform, setActivePlatform] = useState('LinkedIn')
  const [activeTab, setActiveTab] = useState('queue')
  const [viewMode, setViewMode] = useState('list')
  const [showComposer, setShowComposer] = useState(true)
  const [composer, setComposer] = useState(INITIAL_COMPOSER)
  const [connecting, setConnecting] = useState(null)
  const [submitting, setSubmitting] = useState('')
  const [uploading, setUploading] = useState(false)
  const [publishingId, setPublishingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  const pendingActionRef = useRef(null)
  const toastTimerRef = useRef(null)

  const showToast = useCallback((message, tone = 'success') => {
    window.clearTimeout(toastTimerRef.current)
    setToast({ message, tone })
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  const refreshQueue = useCallback(async () => {
    const { data } = await api.get('/scheduler/queue')
    setQueue(data)
  }, [])

  const refreshCreds = useCallback(async () => {
    const { data } = await api.get('/social/credentials')
    setSavedCreds(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        await Promise.all([refreshQueue(), refreshCreds()])
      } catch {
        if (!cancelled) {
          showToast('Unable to load the publish workspace right now.', 'danger')
        }
      }
    }

    void boot()
    const intervalId = window.setInterval(() => {
      void refreshQueue().catch(() => {})
      void refreshCreds().catch(() => {})
    }, 8000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.clearTimeout(toastTimerRef.current)
    }
  }, [refreshCreds, refreshQueue, showToast])

  useEffect(() => {
    const firstConnected = savedCreds[0]?.platform
    const firstQueued = queue[0]?.platform
    if (firstConnected && !savedCreds.some((cred) => cred.platform === activePlatform)) {
      setActivePlatform(firstConnected)
      return
    }
    if (!firstConnected && firstQueued && activePlatform === 'LinkedIn') {
      setActivePlatform(firstQueued)
    }
  }, [activePlatform, queue, savedCreds])

  const executeComposer = useCallback(
    async (snapshot, mode, skipCredentialCheck = false) => {
      const trimmedContent = snapshot.content.trim()
      const title = snapshot.title.trim()
      const videoTitle = snapshot.videoTitle.trim()
      const isYouTube = activePlatform === 'YouTube'
      const isVideo = snapshot.mediaKind === 'video'

      if (!trimmedContent && !snapshot.mediaUrl) {
        showToast('Add copy or media before publishing.', 'danger')
        return
      }

      if (mode === 'schedule' && !snapshot.scheduledAt) {
        showToast('Pick an exact send time before scheduling this post.', 'danger')
        return
      }

      if (isYouTube && isVideo && !videoTitle && !title) {
        showToast('Add a title for the YouTube video before sending it live.', 'danger')
        return
      }

      const payload = {
        platform: activePlatform,
        title: title || undefined,
        content: trimmedContent,
        image_url: snapshot.mediaKind === 'image' ? snapshot.mediaUrl : undefined,
        media_kind: snapshot.mediaKind || undefined,
        video_url: snapshot.mediaKind === 'video' ? snapshot.mediaUrl : undefined,
        video_title: isYouTube ? videoTitle || title || undefined : undefined,
        video_category: isYouTube ? snapshot.videoCategory : undefined,
        video_privacy: isYouTube ? snapshot.videoPrivacy : undefined,
        video_license: isYouTube ? snapshot.videoLicense : undefined,
        notify_subscribers: isYouTube ? snapshot.notifySubscribers : undefined,
        made_for_kids: isYouTube ? snapshot.madeForKids : undefined,
        scheduled_at: mode === 'schedule' ? new Date(snapshot.scheduledAt).toISOString() : new Date().toISOString(),
        status: 'scheduled',
      }

      const hasCreds = savedCreds.some((cred) => cred.platform === activePlatform)
      if (mode === 'publish' && !hasCreds && !skipCredentialCheck) {
        pendingActionRef.current = { type: 'compose', platform: activePlatform, snapshot }
        connectPlatform(activePlatform)
        return
      }

      setSubmitting(mode)
      try {
        const createResponse = await api.post('/scheduler/queue', payload)
        if (mode === 'publish') {
          const publishResponse = await api.post('/social/publish', {
            post_id: createResponse.data.post_id,
            platform: activePlatform,
            content: payload.content,
            video_url: payload.video_url,
            video_title: payload.video_title,
            video_category: payload.video_category,
            video_privacy: payload.video_privacy,
            video_license: payload.video_license,
            notify_subscribers: payload.notify_subscribers,
            made_for_kids: payload.made_for_kids,
          })
          showToast(
            publishResponse.data.status === 'published'
              ? `${activePlatform} posted live successfully.`
              : publishResponse.data.response || `The ${activePlatform} post needs attention.`,
            publishResponse.data.status === 'published' ? 'success' : 'danger',
          )
          setActiveTab(publishResponse.data.status === 'published' ? 'sent' : 'approvals')
        } else {
          showToast(
            `${activePlatform} queued for ${formatDayLabel(payload.scheduled_at)} at ${formatClock(payload.scheduled_at)}.`,
            'success',
          )
          if (!hasCreds) {
            showToast('The post is scheduled. Connect the account before send time so it can publish live.', 'warning')
          }
          setActiveTab('queue')
        }

        setComposer(INITIAL_COMPOSER)
        await refreshQueue()
      } catch (error) {
        showToast(error?.response?.data?.detail || 'We could not save this post.', 'danger')
      } finally {
        setSubmitting('')
      }
    },
    [activePlatform, refreshQueue, savedCreds, showToast],
  )

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type !== 'oauth_done') return

      setConnecting(null)
      if (event.data.status === 'success') {
        void refreshCreds()
        showToast(`${event.data.platform} connected successfully.`, 'success')

        const pending = pendingActionRef.current
        if (pending && pending.platform === event.data.platform) {
          pendingActionRef.current = null
          if (pending.type === 'compose') {
            void executeComposer(pending.snapshot, 'publish', true)
          }
          if (pending.type === 'queue') {
            void publishQueuedPost(pending.post, true)
          }
        }
      } else {
        pendingActionRef.current = null
        showToast(
          `${event.data.platform} connection failed${event.data.error ? `: ${event.data.error}` : '.'}`,
          'danger',
        )
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [executeComposer, refreshCreds, showToast])

  const connectPlatform = (platform) => {
    const token = window.localStorage.getItem('agentic-token')
    if (!token) {
      showToast('Please log in again before connecting an account.', 'danger')
      return
    }

    const path = OAUTH_PATH[platform]
    if (!path) {
      showToast(`This workspace does not have an OAuth route for ${platform} yet.`, 'danger')
      return
    }

    try {
      const userId = decodeJwtPayload(token).sub
      const url = buildBackendUrl(`${path}?user_id=${encodeURIComponent(userId)}`)
      setConnecting(platform)
      const popup = window.open(url, `connect_${platform}`, 'width=640,height=760,scrollbars=yes')

      const poll = window.setInterval(() => {
        if (popup?.closed) {
          window.clearInterval(poll)
          setConnecting(null)
          pendingActionRef.current = null
          void refreshCreds().catch(() => {})
        }
      }, 800)
    } catch {
      showToast('We could not start the account connection flow.', 'danger')
    }
  }

  const publishQueuedPost = useCallback(
    async (post, skipCredentialCheck = false) => {
      const hasCreds = savedCreds.some((cred) => cred.platform === post.platform)
      if (!hasCreds && !skipCredentialCheck) {
        pendingActionRef.current = { type: 'queue', platform: post.platform, post }
        connectPlatform(post.platform)
        return
      }

      setPublishingId(post.id)
      try {
        const response = await api.post('/social/publish', {
          post_id: post.id,
          platform: post.platform,
          content: post.content,
          video_url: post.video_url,
          video_title: post.video_title,
          video_category: post.video_category,
          video_privacy: post.video_privacy,
          video_license: post.video_license,
          notify_subscribers: post.notify_subscribers,
          made_for_kids: post.made_for_kids,
        })

        showToast(
          response.data.status === 'published'
            ? `${post.platform} posted live successfully.`
            : response.data.response || `${post.platform} publish needs attention.`,
          response.data.status === 'published' ? 'success' : 'danger',
        )
        setActiveTab(response.data.status === 'published' ? 'sent' : 'approvals')
        await refreshQueue()
      } catch (error) {
        showToast(error?.response?.data?.detail || 'Publish failed. Reconnect the account and try again.', 'danger')
      } finally {
        setPublishingId(null)
      }
    },
    [refreshQueue, savedCreds, showToast],
  )

  const deletePost = useCallback(
    async (postId) => {
      setDeletingId(postId)
      try {
        await api.delete(`/scheduler/queue/${postId}`)
        setQueue((current) => current.filter((post) => post.id !== postId))
      } catch (error) {
        showToast(error?.response?.data?.detail || 'Unable to delete that post.', 'danger')
      } finally {
        setDeletingId(null)
      }
    },
    [showToast],
  )

  const uploadMedia = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/social/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setComposer((current) => ({
        ...current,
        mediaUrl: response.data.url,
        mediaKind: response.data.media_kind,
      }))

      if (response.data.media_kind === 'video' && activePlatform !== 'YouTube') {
        showToast('Video preview is attached. Direct live video publishing is currently optimized for YouTube.', 'warning')
      } else {
        showToast('Media attached to the post draft.', 'success')
      }
    } catch (error) {
      showToast(error?.response?.data?.detail || 'Media upload failed.', 'danger')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const generateVideoMetadata = async () => {
    const topic = composer.content.trim() || composer.title.trim()
    if (!topic) {
      showToast('Write a topic or rough caption first so AI can shape the metadata.', 'danger')
      return
    }

    setSubmitting('metadata')
    try {
      const response = await api.post('/social/generate-video-metadata', { topic })
      setComposer((current) => ({
        ...current,
        videoTitle: response.data.title || current.videoTitle,
        content: response.data.description || current.content,
      }))
      showToast('AI metadata is ready for the YouTube post.', 'success')
    } catch (error) {
      showToast(error?.response?.data?.detail || 'AI metadata generation failed.', 'danger')
    } finally {
      setSubmitting('')
    }
  }

  const copyToClipboard = useCallback((value) => {
    if (!value) return
    window.navigator.clipboard.writeText(value).then(() => {
      showToast('Copied to clipboard.', 'success')
    }).catch(() => {
      showToast('Copy failed on this browser.', 'danger')
    })
  }, [showToast])

  const credsByPlatform = useMemo(() => {
    const map = new Map()
    savedCreds.forEach((cred) => map.set(cred.platform, cred))
    return map
  }, [savedCreds])

  const activePlatformPosts = useMemo(() => {
    return sortByFreshness(queue.filter((post) => post.platform === activePlatform))
  }, [activePlatform, queue])

  const publishedPosts = useMemo(
    () => activePlatformPosts.filter((post) => post.status === 'published'),
    [activePlatformPosts],
  )
  const failedPosts = useMemo(
    () => activePlatformPosts.filter((post) => post.status === 'failed'),
    [activePlatformPosts],
  )
  const scheduledPosts = useMemo(
    () => activePlatformPosts.filter((post) => post.status === 'scheduled' || post.status === 'publishing'),
    [activePlatformPosts],
  )

  const draftPreview = useMemo(() => {
    if (!composerHasContent(composer)) return null
    return {
      id: 'draft-preview',
      platform: activePlatform,
      status: 'draft',
      title: composer.title.trim(),
      content: composer.content.trim(),
      image_url: composer.mediaKind === 'image' ? composer.mediaUrl : '',
      video_url: composer.mediaKind === 'video' ? composer.mediaUrl : '',
      created_at: new Date().toISOString(),
    }
  }, [activePlatform, composer])

  const draftCount = draftPreview ? 1 : 0

  const tabCounts = {
    queue: scheduledPosts.length,
    drafts: draftCount,
    approvals: failedPosts.length,
    sent: publishedPosts.length,
  }

  const visiblePosts = useMemo(() => {
    if (activeTab === 'drafts') {
      return draftPreview ? [draftPreview] : []
    }
    if (activeTab === 'approvals') {
      return failedPosts
    }
    if (activeTab === 'sent') {
      return publishedPosts
    }
    return scheduledPosts
  }, [activeTab, draftPreview, failedPosts, publishedPosts, scheduledPosts])

  const groupedPosts = useMemo(() => {
    return groupPostsByDay(visiblePosts, (post) => post.published_at || post.scheduled_at || post.created_at)
  }, [visiblePosts])

  const timelineData = useMemo(() => {
    if (activeTab !== 'queue' || viewMode !== 'list') return null

    const days = []
    const now = new Date()
    
    // Predefined slot times (24h format)
    const slotTimes = ['08:00', '12:00', '16:00', '20:00']

    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
      
      // Label formatting
      let dayLabel = dayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
      if (i === 0) dayLabel = 'Today'
      else if (i === 1) dayLabel = 'Tomorrow'

      // Get posts scheduled for this day
      const dayPosts = scheduledPosts.filter((post) => {
        const postDate = parseDateLike(post.scheduled_at)
        if (!postDate) return false
        return (
          postDate.getFullYear() === dayDate.getFullYear() &&
          postDate.getMonth() === dayDate.getMonth() &&
          postDate.getDate() === dayDate.getDate()
        )
      })

      // Build items for this day
      const items = []
      
      // Track which slots are occupied
      const occupiedSlots = new Set()

      // Map posts to items
      dayPosts.forEach((post) => {
        const postDate = parseDateLike(post.scheduled_at)
        // Check if post falls near any predefined slot (within 30 mins)
        let matchedSlotIdx = -1
        slotTimes.forEach((timeStr, idx) => {
          const [h, m] = timeStr.split(':').map(Number)
          const slotTimeMs = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), h, m).getTime()
          const diffMins = Math.abs(postDate.getTime() - slotTimeMs) / 60000
          if (diffMins <= 30) {
            matchedSlotIdx = idx
          }
        })

        if (matchedSlotIdx !== -1) {
          occupiedSlots.add(matchedSlotIdx)
        }

        items.push({
          type: 'post',
          time: postDate,
          data: post
        })
      })

      // Add empty slots (only future ones)
      slotTimes.forEach((timeStr, idx) => {
        if (occupiedSlots.has(idx)) return // Already has a post

        const [h, m] = timeStr.split(':').map(Number)
        const slotDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), h, m)
        
        // Only show if it's in the future
        if (slotDate.getTime() > now.getTime()) {
          items.push({
            type: 'slot',
            time: slotDate,
            label: slotDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          })
        }
      })

      // Sort items by time
      items.sort((a, b) => a.time.getTime() - b.time.getTime())

      days.push({
        label: dayLabel,
        items
      })
    }
    return days
  }, [activeTab, viewMode, scheduledPosts])

  const activeMeta = PLATFORM_META[activePlatform] || PLATFORM_META.LinkedIn
  const activeCred = credsByPlatform.get(activePlatform)

  return (
    <div className="publish-workspace">
      {toast && <div className={`publish-toast ${toast.tone}`}>{toast.message}</div>}

      <div className="publish-topbar">
        <div className="publish-profile-card card">
          <div className="publish-profile-head">
            <div className="publish-profile-avatar" style={{ background: activeMeta.surface, color: activeMeta.color }}>
              {activeMeta.short}
            </div>
            <div>
              <div className="publish-profile-name">{activePlatform} Real-Time Publishing</div>
              <div className="publish-profile-sub">
                {activeCred
                  ? `${activeCred.preview} connected. Publish now posts live immediately and scheduled posts stay in queue until their slot.`
                  : `Connect ${activePlatform} and this workspace will send posts live in real time.`}
              </div>
            </div>
          </div>

          <div className="publish-tab-row">
            {[
              { id: 'queue', label: 'Queue' },
              { id: 'drafts', label: 'Drafts' },
              { id: 'approvals', label: 'Approvals' },
              { id: 'sent', label: 'Sent' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`publish-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <strong>{tabCounts[tab.id] || 0}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="publish-toolbar">
          <div className="publish-view-toggle">
            <button
              type="button"
              className={`publish-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              className={`publish-view-btn ${viewMode === 'calendar' ? 'is-active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
          <button type="button" className="publish-primary-btn" onClick={() => setShowComposer((open) => !open)}>
            {showComposer ? 'Hide composer' : 'New post'}
          </button>
        </div>
      </div>

      <div className="publish-summary-grid">
        <div className="publish-summary-card card">
          <span>Connected</span>
          <strong>{savedCreds.length}</strong>
          <small>Accounts ready to post live</small>
        </div>
        <div className="publish-summary-card card">
          <span>Waiting</span>
          <strong>{scheduledPosts.length}</strong>
          <small>Posts queued for the selected account</small>
        </div>
        <div className="publish-summary-card card">
          <span>Sent</span>
          <strong>{publishedPosts.length}</strong>
          <small>Delivered on or before Thursday, July 23, 2026</small>
        </div>
        <div className="publish-summary-card card">
          <span>Attention</span>
          <strong>{failedPosts.length}</strong>
          <small>Posts that need a reconnect or retry</small>
        </div>
      </div>

      <div className="publish-layout">
        <aside className="publish-sidebar-stack">
          <div className="card publish-account-card">
            <div className="publish-section-head">
              <div>
                <div className="card-title">Account Connections</div>
                <div className="card-sub">Pick the account you want to publish like Buffer, then connect it once.</div>
              </div>
            </div>
            <div className="publish-account-grid">
              {PLATFORM_ORDER.map((platform) => {
                const meta = PLATFORM_META[platform]
                const cred = credsByPlatform.get(platform)
                return (
                  <div
                    key={platform}
                    className={`publish-account-chip ${activePlatform === platform ? 'is-active' : ''}`}
                    onClick={() => setActivePlatform(platform)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setActivePlatform(platform)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{ '--platform-color': meta.color, '--platform-glow': meta.accent }}
                  >
                    <div className="publish-account-chip-top">
                      <div className="publish-account-chip-badge" style={{ background: meta.surface, color: meta.color }}>
                        {meta.short}
                      </div>
                      <div className={`publish-connected-dot ${cred ? 'is-live' : ''}`} />
                    </div>
                    <div className="publish-account-chip-name">{platform}</div>
                    <div className="publish-account-chip-copy">{cred ? cred.preview : meta.description}</div>
                    <button
                      type="button"
                      className="publish-ghost-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        connectPlatform(platform)
                      }}
                    >
                      {connecting === platform ? 'Connecting...' : cred ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {showComposer && (
            <div className="card publish-composer-card">
              <div className="publish-section-head">
                <div>
                  <div className="card-title">Compose For {activePlatform}</div>
                  <div className="card-sub">Post instantly or schedule an exact slot. The queue will update live as statuses change.</div>
                </div>
                <div className="publish-tone-pill" style={{ background: activeMeta.surface, color: activeMeta.color }}>
                  {activeMeta.short}
                </div>
              </div>

              <div className="publish-field">
                <label>Post title</label>
                <input
                  value={composer.title}
                  onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Launch note, product drop, recap"
                />
              </div>

              <div className="publish-field">
                <label>Caption or post copy</label>
                <textarea
                  value={composer.content}
                  onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))}
                  placeholder="Write the exact copy you want to send live."
                  rows={5}
                />
              </div>

              <div className="publish-upload-panel">
                <div>
                  <div className="publish-upload-title">Media attachment</div>
                  <div className="publish-upload-sub">
                    Attach an image or video preview. YouTube uses direct live video publishing.
                  </div>
                </div>
                <label className="publish-upload-btn">
                  {uploading ? 'Uploading...' : 'Attach media'}
                  <input type="file" accept="image/*,video/*" onChange={uploadMedia} hidden />
                </label>
              </div>

              {composer.mediaUrl && (
                <div className="publish-composer-preview">
                  {composer.mediaKind === 'video' ? (
                    <video controls src={buildAssetUrl(composer.mediaUrl)} />
                  ) : (
                    <img src={buildAssetUrl(composer.mediaUrl)} alt="Composer preview" />
                  )}
                </div>
              )}

              {activePlatform === 'YouTube' && (
                <div className="publish-youtube-panel">
                  <div className="publish-field">
                    <label>Video title</label>
                    <input
                      value={composer.videoTitle}
                      onChange={(event) => setComposer((current) => ({ ...current, videoTitle: event.target.value.slice(0, 100) }))}
                      placeholder="A strong YouTube title"
                    />
                  </div>

                  <div className="publish-inline-grid">
                    <div className="publish-field">
                      <label>Category</label>
                      <select
                        value={composer.videoCategory}
                        onChange={(event) => setComposer((current) => ({ ...current, videoCategory: event.target.value }))}
                      >
                        <option value="1">Film & Animation</option>
                        <option value="10">Music</option>
                        <option value="20">Gaming</option>
                        <option value="22">People & Blogs</option>
                        <option value="28">Science & Technology</option>
                      </select>
                    </div>
                    <div className="publish-field">
                      <label>Visibility</label>
                      <select
                        value={composer.videoPrivacy}
                        onChange={(event) => setComposer((current) => ({ ...current, videoPrivacy: event.target.value }))}
                      >
                        <option value="unlisted">Unlisted</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="publish-check-grid">
                    <label>
                      <input
                        type="checkbox"
                        checked={composer.notifySubscribers}
                        onChange={(event) => setComposer((current) => ({ ...current, notifySubscribers: event.target.checked }))}
                      />
                      Notify subscribers
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={composer.madeForKids}
                        onChange={(event) => setComposer((current) => ({ ...current, madeForKids: event.target.checked }))}
                      />
                      Made for kids
                    </label>
                  </div>

                  <button
                    type="button"
                    className="publish-ghost-btn"
                    onClick={generateVideoMetadata}
                    disabled={submitting === 'metadata'}
                  >
                    {submitting === 'metadata' ? 'Generating...' : 'Generate AI metadata'}
                  </button>
                </div>
              )}

              <div className="publish-field">
                <label>Schedule time</label>
                <input
                  type="datetime-local"
                  value={composer.scheduledAt}
                  onChange={(event) => setComposer((current) => ({ ...current, scheduledAt: event.target.value }))}
                />
              </div>

              <div className="publish-composer-actions">
                <button type="button" className="publish-ghost-btn" onClick={() => setComposer(INITIAL_COMPOSER)}>
                  Clear
                </button>
                <button
                  type="button"
                  className="publish-secondary-btn"
                  onClick={() => void executeComposer({ ...composer }, 'schedule')}
                  disabled={submitting === 'publish' || submitting === 'schedule'}
                >
                  {submitting === 'schedule' ? 'Scheduling...' : 'Schedule post'}
                </button>
                <button
                  type="button"
                  className="publish-primary-btn"
                  onClick={() => void executeComposer({ ...composer }, 'publish')}
                  disabled={submitting === 'publish' || submitting === 'schedule'}
                >
                  {submitting === 'publish' ? 'Posting live...' : 'Post now'}
                </button>
              </div>
            </div>
          )}
        </aside>

        <section className="publish-feed-shell card">
          <div className="publish-section-head">
            <div>
              <div className="card-title">
                {viewMode === 'list' ? `${activePlatform} Timeline` : `${activePlatform} Calendar View`}
              </div>
              <div className="card-sub">
                {viewMode === 'list'
                  ? 'A real-time queue of scheduled, draft, and sent posts for the selected account.'
                  : 'A grouped view of what is shipping on each day.'}
              </div>
            </div>
          </div>

          {((activeTab === 'queue' && viewMode === 'calendar' && scheduledPosts.length === 0) || (activeTab !== 'queue' && groupedPosts.length === 0)) && (
            <div className="publish-empty-state">
              <div className="publish-empty-badge" style={{ background: activeMeta.surface, color: activeMeta.color }}>
                {activeMeta.short}
              </div>
              <div className="publish-empty-title">No posts in this lane yet</div>
              <div className="publish-empty-copy">
                Connect the account, compose a post, and publish it live to see the timeline fill in.
              </div>
            </div>
          )}

          {activeTab === 'queue' && viewMode === 'list' && timelineData && (
            <div className="publish-timeline">
              {timelineData.map((day) => (
                <div key={day.label} className="publish-day-group">
                  <div className="publish-day-label">{day.label}</div>
                  <div className="publish-day-stack">
                    {day.items.map((item, idx) => {
                      if (item.type === 'post') {
                        const post = item.data
                        return (
                          <div key={post.id} className="publish-row">
                            <div className="publish-row-time">
                              <div>{formatClock(post.published_at || post.scheduled_at || post.created_at)}</div>
                              <span>{post.status === 'published' ? 'Live' : post.status === 'draft' ? 'Draft' : 'Queue'}</span>
                            </div>
                            <QueueCard
                              post={post}
                              platformPreview={credsByPlatform.get(post.platform)?.preview || ''}
                              busyId={publishingId}
                              deletingId={deletingId}
                              onCopy={copyToClipboard}
                              onDelete={deletePost}
                              onPublish={publishQueuedPost}
                              onEditDraft={() => setShowComposer(true)}
                            />
                          </div>
                        )
                      } else {
                        return (
                          <div key={`slot-${day.label}-${idx}`} className="publish-row publish-slot-row">
                            <div className="publish-row-time">
                              <div>{item.label}</div>
                              <span className="publish-slot-badge">Available</span>
                            </div>
                            <div
                              className="publish-slot-btn"
                              onClick={() => {
                                setComposer((current) => ({
                                  ...current,
                                  scheduledAt: toLocalDatetimeString(item.time),
                                }))
                                setShowComposer(true)
                                setTimeout(() => {
                                  const el = document.querySelector('.publish-composer-card')
                                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                                }, 100)
                              }}
                            >
                              <span className="plus-icon">+</span> New Post
                            </div>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab !== 'queue' && groupedPosts.length > 0 && viewMode === 'list' && (
            <div className="publish-timeline">
              {groupedPosts.map(([label, posts]) => (
                <div key={label} className="publish-day-group">
                  <div className="publish-day-label">{label}</div>
                  <div className="publish-day-stack">
                    {posts.map((post) => (
                      <div key={post.id} className="publish-row">
                        <div className="publish-row-time">
                          <div>{formatClock(post.published_at || post.scheduled_at || post.created_at)}</div>
                          <span>{post.status === 'published' ? 'Live' : post.status === 'draft' ? 'Draft' : 'Queue'}</span>
                        </div>
                        <QueueCard
                          post={post}
                          platformPreview={credsByPlatform.get(post.platform)?.preview || ''}
                          busyId={publishingId}
                          deletingId={deletingId}
                          onCopy={copyToClipboard}
                          onDelete={deletePost}
                          onPublish={publishQueuedPost}
                          onEditDraft={() => setShowComposer(true)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {groupedPosts.length > 0 && viewMode === 'calendar' && (
            <div className="publish-calendar-grid">
              {groupedPosts.map(([label, posts]) => (
                <div key={label} className="publish-calendar-day">
                  <div className="publish-calendar-title">{label}</div>
                  <div className="publish-calendar-count">{posts.length} item{posts.length === 1 ? '' : 's'}</div>
                  <div className="publish-calendar-stack">
                    {posts.map((post) => (
                      <QueueCard
                        key={post.id}
                        post={post}
                        platformPreview={credsByPlatform.get(post.platform)?.preview || ''}
                        busyId={publishingId}
                        deletingId={deletingId}
                        onCopy={copyToClipboard}
                        onDelete={deletePost}
                        onPublish={publishQueuedPost}
                        onEditDraft={() => setShowComposer(true)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
