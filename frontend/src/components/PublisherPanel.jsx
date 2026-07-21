import React from 'react'

export default function PublisherPanel({ publisher }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Publisher</div>
        <div className="page-sub">Track Delivery Results And Retry Anything That Needs Attention.</div>
      </div>

      <div className="stat-grid">
        {[
          { label:'Published', value: publisher.published,      bar:'var(--green)' },
          { label:'Failed',    value: publisher.failed,         bar:'var(--red)' },
          { label:'Total',     value: publisher.results.length, bar:'var(--p2)' },
        ].map((s, i) => (
          <div className="stat-box" key={i} style={{ '--bar-color': s.bar }}>
            <div className="stat-num" style={{ color: s.bar }}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Delivery Log</div>
          <span className="badge badge-success badge-outline">{publisher.published} Successful</span>
        </div>
        {publisher.results.map((r, i) => (
          <div className="post-card" key={i} style={{ borderLeft:`4px solid ${r.status === 'published' ? 'var(--green)' : 'var(--red)'}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7, flexWrap:'wrap' }}>
              <span style={{ fontWeight:800, fontSize:'0.83rem', color:'var(--text)' }}>{r.platform}</span>
              <span className={`badge badge-outline ${r.status === 'published' ? 'badge-success' : 'badge-error'}`}>{r.status}</span>
              {r.retry && <span className="badge badge-warning badge-outline">Retry Queued</span>}
              {r.published_at && <span style={{ marginLeft:'auto', fontSize:'0.68rem', color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}>{r.published_at.slice(0,19).replace('T',' ')}</span>}
            </div>
            <div style={{ fontSize:'0.78rem', color: r.status === 'published' ? 'var(--green)' : 'var(--red)', marginBottom:5 }}>{r.response}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text3)', lineHeight:1.5 }}>"{r.content}"</div>
          </div>
        ))}
      </div>
    </div>
  )
}
