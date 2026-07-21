import React from 'react'

export default function SuggestionPanel({ suggestions }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">AI Suggestions</div>
        <div className="page-sub">Quick Wins, A/B Tests, And Rescue Plans.</div>
      </div>

      <div className="split-grid">
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Quick Wins</div>
            <span className="badge badge-success badge-outline">Act Now</span>
          </div>
          {suggestions.quick_wins.map((w, i) => (
            <div className="list-item" key={i} style={{ borderLeftColor:'var(--green)' }}>{w}</div>
          ))}
        </div>
        <div className="card" style={{ margin:0 }}>
          <div className="card-head">
            <div className="card-title">Rescue Plans</div>
            <span className="badge badge-error badge-outline">If Underperforming</span>
          </div>
          {suggestions.rescue_plans.map((r, i) => (
            <div className="list-item" key={i} style={{ borderLeftColor:'var(--red)' }}>{r}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">A/B Test Ideas</div>
          <span className="badge badge-primary badge-outline">Experiment</span>
        </div>
        {suggestions.ab_tests.map((t, i) => (
          <div className="list-item" key={i}>
            <div style={{ display:'flex', gap:8, marginBottom:7, flexWrap:'wrap' }}>
              <span className="badge badge-info badge-outline">A - {t.variant_a}</span>
              <span className="badge badge-success badge-outline">B - {t.variant_b}</span>
            </div>
            <div style={{ fontSize:'0.73rem', color:'var(--text3)' }}>Goal: {t.goal}</div>
          </div>
        ))}
        <div className="divider" />
        <div style={{ fontSize:'0.78rem', color:'var(--text3)' }}>
          Focus: <span style={{ color:'var(--p2)', fontWeight:700 }}>{suggestions.focus_platform}</span> - {suggestions.note}
        </div>
      </div>
    </div>
  )
}
