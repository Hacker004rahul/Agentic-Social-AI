import React from 'react'

const PLAT_COLOR = { Instagram:'#e1306c', LinkedIn:'#0ea5e9', Twitter:'#e5e5e5', TikTok:'#ff0050', YouTube:'#ff0000', Facebook:'#1877f2' }

export default function AnalyticsPanel({ analytics }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Analytics</div>
        <div className="page-sub">AI-Predicted Performance Metrics Per Platform.</div>
      </div>

      <div className="stat-grid">
        {[
          { label: 'Best Platform',     value: analytics.best_platform,                color: 'var(--blue)',  style: { '--bar-color': 'var(--blue)' } },
          { label: 'Estimated Reach',   value: analytics.total_reach.toLocaleString(), color: 'var(--green)', style: { '--bar-color': 'var(--green)' } },
          { label: 'Platforms Tracked', value: analytics.platform_metrics.length,      color: 'var(--text2)', style: { '--bar-color': 'var(--text2)' } },
        ].map((s, i) => (
          <div className="stat-box" key={i} style={s.style}>
            <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Platform Breakdown</div>
          <span className="badge badge-primary badge-outline">{analytics.platform_metrics.length} Platforms</span>
        </div>

        {analytics.platform_metrics.map((m, i) => {
          const color = PLAT_COLOR[m.platform] || 'var(--p)'
          const eng   = parseFloat(m.engagement_rate)
          const pct   = Math.min(eng * 8, 100)
          const status = eng > 5 ? { label:'Strong', cls:'badge-success' } : eng > 2 ? { label:'Average', cls:'badge-warning' } : { label:'Low', cls:'badge-error' }
          return (
            <div className="list-item" key={i} style={{ borderLeftColor: color }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }} />
                <span style={{ fontWeight:800, fontSize:'0.88rem', color:'var(--text)' }}>{m.platform}</span>
                <span className={`badge badge-outline ${status.cls}`} style={{ marginLeft:'auto' }}>{status.label} - {m.engagement_rate} Eng</span>
              </div>
              <div className="mini-metric-grid">
                {[
                  { l:'Likes',    v: m.likes.toLocaleString() },
                  { l:'Comments', v: m.comments.toLocaleString() },
                  { l:'Shares',   v: m.shares.toLocaleString() },
                  { l:'Reach',    v: m.reach.toLocaleString() },
                ].map((s, j) => (
                  <div key={j} className="mini-metric">
                    <div>{s.v}</div>
                    <span>{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="prog-wrap">
                <div className="prog-fill" style={{ width:`${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}

        <div className="divider" />
        <div style={{ fontSize:'0.78rem', color:'var(--text2)', lineHeight:1.6 }}>
          {analytics.improvement_tip}
        </div>
      </div>
    </div>
  )
}
