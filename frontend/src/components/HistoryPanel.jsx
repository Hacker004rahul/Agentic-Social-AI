import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Empty } from '../App'

export default function HistoryPanel() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/history').then(r => setHistory(r.data.reverse())).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Run History</div>
        <div className="page-sub">{history.length} previous agent runs</div>
      </div>

      {loading && <div className="loading-wrap"><div className="spin" /></div>}
      {!loading && history.length === 0 && <Empty icon="◷" title="No history yet" sub="Run the agents from Dashboard to start recording history." />}

      {history.map((h, i) => (
        <div className="history-card" key={i}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px rgba(16,185,129,0.6)' }} />
              <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text)' }}>{h.brand_name}</span>
            </div>
            <span style={{ fontSize:'0.68rem', color:'var(--text3)', fontFamily:'JetBrains Mono, monospace' }}>{h.timestamp}</span>
          </div>
          <div style={{ fontSize:'0.78rem', color:'var(--text2)', lineHeight:1.65, paddingLeft:17 }}>{h.summary}</div>
        </div>
      ))}
    </div>
  )
}
