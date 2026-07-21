import React from 'react'

const PLAT_C = { Instagram:'#e1306c', LinkedIn:'#0077b5', Twitter:'#e7e9ea', TikTok:'#ff0050', YouTube:'#ff0000', Facebook:'#1877f2' }

export default function CampaignPanel({ campaign }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">7-Day Campaign</div>
        <div className="page-sub">{campaign.campaign_name}</div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Weekly Plan</div>
          <span className="badge b-purple">{campaign.goal}</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th><th>Platform</th><th>Post Type</th><th>Format</th><th>Time</th><th>Hashtags</th>
              </tr>
            </thead>
            <tbody>
              {campaign.weekly_plan.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{d.day}</td>
                  <td><span style={{ fontWeight:700, fontSize:'0.78rem', color: PLAT_C[d.platform] || 'var(--p2)' }}>{d.platform}</span></td>
                  <td style={{ color:'var(--text)', fontSize:'0.8rem' }}>{d.post_type}</td>
                  <td><span className="tag">{d.format}</span></td>
                  <td style={{ whiteSpace:'nowrap', color:'var(--text3)', fontSize:'0.75rem', fontFamily:'JetBrains Mono,monospace' }}>{d.post_time}</td>
                  <td>{d.hashtags.map((h, j) => <span className="tag" key={j}>{h}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
