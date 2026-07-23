import React, { useCallback, useEffect, useMemo, useState } from 'react'

import api from '../lib/api'
import {
  PLATFORM_META,
  PLATFORM_ORDER,
  buildAssetUrl,
  formatClock,
  formatDayLabel,
  formatRelativeTime,
  getPostPreview,
  groupPostsByDay,
  parseDateLike,
} from '../lib/publishing'

function sortByNewest(posts) {
  return [...posts].sort((left, right) => {
    const leftTime = parseDateLike(left.published_at || left.scheduled_at || left.created_at)?.getTime() || 0
    const rightTime = parseDateLike(right.published_at || right.scheduled_at || right.created_at)?.getTime() || 0
    return rightTime - leftTime
  })
}

function StreamCard({ post }) {
  const meta = PLATFORM_META[post.platform] || PLATFORM_META.LinkedIn
  const preview = getPostPreview(post)

  return (
    <div className="sent-stream-card" style={{ '--platform-color': meta.color, '--platform-glow': meta.accent }}>
      <div className="sent-stream-head">
        <div className="sent-stream-badge" style={{ background: meta.surface, color: meta.color }}>
          {meta.short}
        </div>
        <div>
          <div className="sent-stream-name">{post.platform} Delivery</div>
          <div className="sent-stream-time">
            {post.status === 'published'
              ? `Sent ${formatRelativeTime(post.published_at)}`
              : `Needs attention since ${formatRelativeTime(post.created_at || post.scheduled_at)}`}
          </div>
        </div>
        <div className={`publish-status-pill ${post.status === 'published' ? 'is-success' : 'is-danger'}`}>
          {post.status === 'published' ? 'Live' : 'Retry needed'}
        </div>
      </div>

      {post.title && <div className="sent-stream-title">{post.title}</div>}
      <div className="sent-stream-copy">{post.content || 'Delivery record ready.'}</div>

      {preview && (
        <div className="sent-stream-media">
          {preview.kind === 'video' ? (
            <video controls src={buildAssetUrl(preview.url)} />
          ) : (
            <img src={buildAssetUrl(preview.url)} alt="Published preview" />
          )}
        </div>
      )}

      <div className={`publish-response-strip ${post.status === 'published' ? 'is-success' : 'is-danger'}`}>
        {post.api_response || (post.status === 'published' ? 'Published successfully.' : 'No response captured yet.')}
      </div>

      <div className="sent-stream-footer">
        <span>{formatDayLabel(post.published_at || post.scheduled_at || post.created_at)}</span>
        <strong>{formatClock(post.published_at || post.scheduled_at || post.created_at)}</strong>
      </div>
    </div>
  )
}

export default function PublisherPanel() {
  const [queue, setQueue] = useState([])
  const [savedCreds, setSavedCreds] = useState([])
  const [activePlatform, setActivePlatform] = useState('All')

  const refresh = useCallback(async () => {
    const [queueResponse, credsResponse] = await Promise.all([
      api.get('/scheduler/queue'),
      api.get('/social/credentials'),
    ])
    setQueue(queueResponse.data)
    setSavedCreds(credsResponse.data)
  }, [])

  useEffect(() => {
    void refresh().catch(() => {})
    const intervalId = window.setInterval(() => {
      void refresh().catch(() => {})
    }, 8000)

    return () => window.clearInterval(intervalId)
  }, [refresh])

  const publishedOrFailed = useMemo(() => {
    const interesting = queue.filter((post) => post.status === 'published' || post.status === 'failed')
    const scoped = activePlatform === 'All'
      ? interesting
      : interesting.filter((post) => post.platform === activePlatform)
    return sortByNewest(scoped)
  }, [activePlatform, queue])

  const published = publishedOrFailed.filter((post) => post.status === 'published')
  const failed = publishedOrFailed.filter((post) => post.status === 'failed')
  const latestPublished = published[0]
  const grouped = groupPostsByDay(publishedOrFailed, (post) => post.published_at || post.created_at || post.scheduled_at)

  const today = new Date()
  const todayPublished = published.filter((post) => {
    const date = parseDateLike(post.published_at)
    return (
      date &&
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  })

  return (
    <div className="publisher-dashboard">
      <div className="publisher-hero">
        <div className="card publisher-hero-card">
          <div className="publisher-hero-copy">
            <span className="publisher-kicker">Sent stream</span>
            <div className="page-title">Live delivery, retries, and platform health</div>
            <div className="page-sub">
              Every sent post now lands here with the real queue status, so the Publisher tab reflects actual delivery instead of only generated mock output.
            </div>
          </div>
          <div className="publisher-platform-filter">
            <button
              type="button"
              className={`publisher-platform-btn ${activePlatform === 'All' ? 'is-active' : ''}`}
              onClick={() => setActivePlatform('All')}
            >
              All
            </button>
            {PLATFORM_ORDER.map((platform) => (
              <button
                key={platform}
                type="button"
                className={`publisher-platform-btn ${activePlatform === platform ? 'is-active' : ''}`}
                onClick={() => setActivePlatform(platform)}
              >
                {PLATFORM_META[platform].short}
                <span>{platform}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="publisher-metric-grid">
          <div className="publisher-metric-card card">
            <span>Published today</span>
            <strong>{todayPublished.length}</strong>
            <small>Posts delivered on Thursday, July 23, 2026</small>
          </div>
          <div className="publisher-metric-card card">
            <span>Sent total</span>
            <strong>{published.length}</strong>
            <small>Successful deliveries in this lane</small>
          </div>
          <div className="publisher-metric-card card">
            <span>Retries waiting</span>
            <strong>{failed.length}</strong>
            <small>These should be retried from the Scheduler</small>
          </div>
          <div className="publisher-metric-card card">
            <span>Connected accounts</span>
            <strong>{savedCreds.length}</strong>
            <small>Accounts currently ready for live publish</small>
          </div>
        </div>
      </div>

      {latestPublished && (
        <div className="card publisher-feature-card">
          <div className="publisher-feature-head">
            <div>
              <div className="card-title">Latest live post</div>
              <div className="card-sub">
                {latestPublished.platform} sent {formatRelativeTime(latestPublished.published_at)}.
              </div>
            </div>
            <div className="publish-status-pill is-success">Live now</div>
          </div>

          <div className="publisher-feature-body">
            <div className="publisher-feature-meta">
              <div className="publisher-feature-platform">{latestPublished.platform}</div>
              <div className="publisher-feature-copy">{latestPublished.content}</div>
              <div className="publisher-feature-response">
                {latestPublished.api_response || 'Published successfully.'}
              </div>
            </div>
            {getPostPreview(latestPublished) && (
              <div className="publisher-feature-media">
                {getPostPreview(latestPublished).kind === 'video' ? (
                  <video controls src={buildAssetUrl(getPostPreview(latestPublished).url)} />
                ) : (
                  <img src={buildAssetUrl(getPostPreview(latestPublished).url)} alt="Latest published post" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card publisher-stream-card">
        <div className="publisher-stream-head">
          <div>
            <div className="card-title">Delivery stream</div>
            <div className="card-sub">
              Published and failed items grouped by day for the selected destination.
            </div>
          </div>
        </div>

        {grouped.length === 0 && (
          <div className="publish-empty-state">
            <div className="publish-empty-badge">PB</div>
            <div className="publish-empty-title">Nothing has been sent yet</div>
            <div className="publish-empty-copy">
              Publish a post from the Scheduler and it will appear here as soon as the queue updates.
            </div>
          </div>
        )}

        {grouped.length > 0 && (
          <div className="publisher-stream-groups">
            {grouped.map(([label, posts]) => (
              <div key={label} className="publisher-stream-group">
                <div className="publisher-stream-label">{label}</div>
                <div className="publisher-stream-stack">
                  {posts.map((post) => (
                    <StreamCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
