import React from 'react'

export default function RecyclePanel({ recycle }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Evergreen Recycler</div>
        <div className="page-sub">High-performing posts recycled with fresh intros automatically</div>
      </div>

      <div className="stat-grid">
        {[
          { label:'Evergreen Pool',    value: recycle.evergreen_pool,  bar:'var(--green)' },
          { label:'Recycled This Run', value: recycle.recycled.length, bar:'var(--p2)'    },
        ].map((s, i) => (
          <div className="stat-box" key={i} style={{ '--bar-color': s.bar }}>
            <div className="stat-num" style={{ color: s.bar }}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Recycled Posts</div>
          <span className="badge b-green">Auto-generated</span>
        </div>
        {recycle.recycled.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♻</div>
            <div className="empty-title">Pool is empty</div>
            <div className="empty-sub">Run agents more than once to build the evergreen pool.</div>
          </div>
        ) : recycle.recycled.map((r, i) => (
          <div key={i} style={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:12 }}>
            <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' }}>
              <span className="badge b-green">Recycle #{r.recycle_count}</span>
              <span className="badge b-cyan">Next: {r.next_recycle}</span>
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--text3)', marginBottom:9, lineHeight:1.5 }}>Original: {r.original}</div>
            <div style={{ background:'var(--s2)', borderRadius:'var(--r2)', padding:'12px 14px', fontSize:'0.8rem', color:'var(--text2)', lineHeight:1.65, whiteSpace:'pre-wrap', borderLeft:'2px solid var(--green)' }}>
              {r.recycled_post}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
