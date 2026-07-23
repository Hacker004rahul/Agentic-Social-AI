export const PLATFORM_META = {
  LinkedIn: {
    short: 'LI',
    color: '#0a66c2',
    accent: '#7dd3fc',
    surface: 'linear-gradient(135deg, rgba(10, 102, 194, 0.18), rgba(125, 211, 252, 0.12))',
    description: 'Thought leadership and company updates',
  },
  Instagram: {
    short: 'IG',
    color: '#e1306c',
    accent: '#f9a8d4',
    surface: 'linear-gradient(135deg, rgba(225, 48, 108, 0.18), rgba(249, 168, 212, 0.12))',
    description: 'Visual stories and launches',
  },
  Facebook: {
    short: 'FB',
    color: '#1877f2',
    accent: '#93c5fd',
    surface: 'linear-gradient(135deg, rgba(24, 119, 242, 0.18), rgba(147, 197, 253, 0.12))',
    description: 'Community posts and announcements',
  },
  Twitter: {
    short: 'X',
    color: '#111827',
    accent: '#94a3b8',
    surface: 'linear-gradient(135deg, rgba(15, 23, 42, 0.18), rgba(148, 163, 184, 0.12))',
    description: 'Fast reactions and live updates',
  },
  YouTube: {
    short: 'YT',
    color: '#ef4444',
    accent: '#fca5a5',
    surface: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(252, 165, 165, 0.12))',
    description: 'Video drops and channel updates',
  },
  Buffer: {
    short: 'BF',
    color: '#6b7280',
    accent: '#cbd5e1',
    surface: 'linear-gradient(135deg, rgba(107, 114, 128, 0.18), rgba(203, 213, 225, 0.12))',
    description: 'Proxy publishing and queue routing',
  },
}

export const PLATFORM_ORDER = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter', 'YouTube', 'Buffer']

export const OAUTH_PATH = {
  LinkedIn: '/social/oauth/linkedin/start',
  Facebook: '/social/oauth/facebook/start',
  Instagram: '/social/oauth/facebook/start',
  Twitter: '/social/oauth/x/start',
  YouTube: '/social/oauth/youtube/start',
  Buffer: '/social/oauth/buffer/start',
}

const DEV_BACKEND_ORIGIN = 'http://127.0.0.1:8000'

export function backendOrigin() {
  return import.meta.env.DEV ? DEV_BACKEND_ORIGIN : window.location.origin
}

export function buildBackendUrl(path = '') {
  if (!path) return backendOrigin()
  if (/^https?:\/\//i.test(path)) return path
  return `${backendOrigin()}${path}`
}

export function buildAssetUrl(path = '') {
  if (!path) return ''
  if (path.startsWith('data:') || /^https?:\/\//i.test(path)) return path
  return buildBackendUrl(path)
}

export function parseDateLike(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  let strVal = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
    strVal = strVal.replace(' ', 'T')
    if (!strVal.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(strVal)) {
      strVal += 'Z'
    }
  }

  const direct = new Date(strVal)
  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2}) (AM|PM)$/i)
  if (!match) return null

  const [, year, month, day, hourText, minuteText, meridiem] = match
  let hours = Number(hourText)
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hours,
    Number(minuteText),
    0,
    0,
  )
}

export function formatDayLabel(value) {
  const date = parseDateLike(value)
  if (!date) return 'Upcoming'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target - today) / 86400000)

  if (diffDays === 0) return `Today, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  if (diffDays === 1) return `Tomorrow, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  if (diffDays === -1) return `Yesterday, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatClock(value) {
  const date = parseDateLike(value)
  if (!date) return 'Manual slot'
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatRelativeTime(value) {
  const date = parseDateLike(value)
  if (!date) return 'just now'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.round(Math.abs(diffMs) / 60000)
  const isPast = diffMs >= 0

  if (diffMinutes < 1) return isPast ? 'just now' : 'in a moment'
  if (diffMinutes < 60) return isPast ? `${diffMinutes}m ago` : `in ${diffMinutes}m`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return isPast ? `${diffHours}h ago` : `in ${diffHours}h`

  const diffDays = Math.round(diffHours / 24)
  return isPast ? `${diffDays}d ago` : `in ${diffDays}d`
}

export function groupPostsByDay(posts, dateKeyPicker) {
  const groups = new Map()

  posts.forEach((post) => {
    const dateValue = dateKeyPicker(post)
    const label = formatDayLabel(dateValue)
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label).push(post)
  })

  return Array.from(groups.entries())
}

export function getPostPreview(post) {
  if (post.image_data) {
    return { kind: 'image', url: post.image_data }
  }
  if (post.image_url) {
    return { kind: 'image', url: buildAssetUrl(post.image_url) }
  }
  if (post.video_url) {
    return { kind: 'video', url: buildAssetUrl(post.video_url) }
  }
  return null
}
