import React, { useEffect, useState } from 'react'

export default function WorkflowTrace({ trace }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setVisible(i)
      if (i >= trace.length) clearInterval(t)
    }, 100)
    return () => clearInterval(t)
  }, [trace.length])

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-head">
        <div>
          <div className="card-title">Agent Pipeline</div>
          <div className="card-sub">{trace.length} Agents Completed</div>
        </div>
        <span className="badge badge-success badge-outline">All Systems Go</span>
      </div>

      <div className="pipeline">
        {trace.map((t, i) => (
          <React.Fragment key={i}>
            <div className={`pipe-node ${i < visible ? 'done' : i === visible ? 'active' : ''}`}>
              <div className={`pipe-dot ${i < visible ? 'done' : i === visible ? 'active' : 'idle'}`} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: i < visible ? 'var(--text)' : 'var(--text3)', flex: 1 }}>
                {t.agent}
              </span>
              {t.ms && (
                <span style={{ fontSize: '0.64rem', color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {t.ms}ms
                </span>
              )}
              {i < visible && <span className="badge badge-success badge-outline" style={{ fontSize: '0.58rem' }}>Done</span>}
              {i === visible && <span className="badge badge-info badge-outline" style={{ fontSize: '0.58rem' }}>Running</span>}
            </div>
            {i < trace.length - 1 && <div className="pipe-connector" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
