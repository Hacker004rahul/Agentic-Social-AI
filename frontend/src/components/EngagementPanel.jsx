import React from 'react'

export default function EngagementPanel({ engagement }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Engagement Templates</div>
        <div className="page-sub">Ready-to-use replies and DM templates</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Comment Replies</div>
            <span className="badge b-green">Positive</span>
          </div>
          {engagement.comment_replies.map((r, i) => (
            <div className="list-item" key={i}>{r}</div>
          ))}
        </div>
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Negative Handling</div>
            <span className="badge b-yellow">De-escalate</span>
          </div>
          {engagement.negative_replies.map((r, i) => (
            <div className="list-item" key={i} style={{ borderLeftColor:'var(--yellow)' }}>{r}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">DM Templates</div>
          <span className="badge b-blue">{engagement.dm_templates.length} templates</span>
        </div>
        {engagement.dm_templates.map((d, i) => (
          <div key={i} style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'11px 14px', marginBottom:9, fontSize:'0.8rem', color:'var(--text2)', lineHeight:1.55 }}>{d}</div>
        ))}
      </div>
    </div>
  )
}
