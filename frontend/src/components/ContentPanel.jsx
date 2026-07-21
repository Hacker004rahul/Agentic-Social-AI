import React, { useState } from 'react'

const PLAT = {
  Instagram: { color:'#e1306c', icon:'IG' },
  LinkedIn:  { color:'#0ea5e9', icon:'IN' },
  Twitter:   { color:'#e5e5e5', icon:'TW' },
  TikTok:    { color:'#ff0050', icon:'TT' },
  YouTube:   { color:'#ff0000', icon:'YT' },
  Facebook:  { color:'#1877f2', icon:'FB' },
}

export default function ContentPanel({ content }) {
  const [copied, setCopied] = useState(null)

  const copy = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Content Studio</div>
        <div className="page-sub">{content.posts.length} Posts Are Drafted And Ready For Review.</div>
      </div>

      {content.posts.map((p, i) => {
        const meta = PLAT[p.platform] || { color:'var(--fallback-p)', icon:'P' }
        const pct  = Math.min((p.char_count / p.char_limit) * 100, 100)
        const barC = pct > 90 ? 'var(--warning)' : pct > 60 ? 'var(--info)' : 'var(--success)'
        return (
          <div className="post-card card bg-base-100" key={i} style={{ borderLeft:`4px solid ${meta.color}` }}>
            <div className="post-head">
              <div className="platform-avatar" style={{ background:`${meta.color}18`, borderColor:`${meta.color}33`, color:meta.color }}>
                {meta.icon}
              </div>
              <div>
                <div className="post-platform">{p.platform}</div>
                <div className="post-meta">
                  {p.char_count} / {p.char_limit.toLocaleString()} Chars
                  {p.truncated && <span className="text-warning"> Trimmed</span>}
                </div>
              </div>
              <button className="btn btn-outline btn-sm copy-button" onClick={() => copy(p.content, i)}>
                {copied === i ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="post-text">{p.content}</div>
            <div className="char-bar"><div className="char-fill" style={{ width:`${pct}%`, background:barC }} /></div>
          </div>
        )
      })}
    </div>
  )
}
