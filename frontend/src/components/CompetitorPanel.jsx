import React from 'react'

export default function CompetitorPanel({ competitor }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Competitor Intelligence</div>
        <div className="page-sub">AI-detected gaps and counter-strategies</div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
        {competitor.competitor_analysis.map((c, i) => (
          <div className="card" key={i} style={{ margin:0, borderLeft:'3px solid var(--orange)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text)', marginBottom:6 }}>{c.competitor}</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', fontSize:'0.75rem', color:'var(--text3)' }}>
                  <span className="badge b-blue">{c.estimated_posting} posting</span>
                  <span className="badge b-purple">Top: {c.top_content_type}</span>
                  <span className="badge b-cyan">Avg eng: {c.avg_engagement}</span>
                </div>
              </div>
            </div>
            <div className="divider" style={{ margin:'12px 0' }} />
            <div style={{ fontSize:'0.78rem', color:'var(--yellow)', lineHeight:1.5 }}>
              ⚠ Weakness — {c.weakness}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Gaps to Exploit</div>
            <span className="badge b-yellow">Opportunity</span>
          </div>
          {competitor.gaps_to_exploit.map((g, i) => (
            <div className="list-item" key={i} style={{ borderLeftColor:'var(--yellow)' }}>{g}</div>
          ))}
        </div>
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Counter Strategy</div>
            <span className="badge b-green">Action</span>
          </div>
          {competitor.counter_strategy.map((s, i) => (
            <div className="list-item" key={i} style={{ borderLeftColor:'var(--green)' }}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
