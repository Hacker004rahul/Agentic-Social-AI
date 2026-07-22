import React, { useState, useEffect } from 'react'
import api from '../lib/api'

export default function AutonomousPanel() {
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState(null)
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [triggeringBrand, setTriggeringBrand] = useState(null)
  const [message, setMessage] = useState(null)

  const fetchData = async () => {
    try {
      const logsRes = await api.get('/agents/autonomous/logs')
      setLogs(logsRes.data || [])

      const statusRes = await api.get('/agents/autonomous/status')
      setStatus(statusRes.data)

      const brandsRes = await api.get('/brands')
      setBrands((brandsRes.data || []).filter(b => b.autonomous))
    } catch (err) {
      console.error("Failed to load autonomous info", err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [])

  const triggerRun = async (brandName) => {
    setTriggeringBrand(brandName)
    setMessage(null)
    try {
      const { data } = await api.post(`/agents/autonomous/trigger/${brandName}`)
      setMessage({ type: 'success', text: data.message || `Autonomous execution triggered for ${brandName}!` })
      fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to trigger autonomous campaign.' })
    } finally {
      setTriggeringBrand(null)
    }
  }

  const formatTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Autonomous Agent Loops</div>
        <div className="page-sub">Monitor and audit multi-agent campaign workflows running completely on autopilot.</div>
      </div>

      {status && (
        <div className="stat-grid">
          <div className="stat-box" style={{ '--bar-color': 'var(--blue)' }}>
            <div className="stat-num" style={{ color: 'var(--blue)' }}>
              {status.worker_running ? 'Active' : 'Offline'}
            </div>
            <div className="stat-lbl">Worker Status</div>
          </div>
          <div className="stat-box" style={{ '--bar-color': 'var(--green)' }}>
            <div className="stat-num" style={{ color: 'var(--green)' }}>
              {status.autonomous_brands_count}
            </div>
            <div className="stat-lbl">Autonomous Brands</div>
          </div>
          <div className="stat-box" style={{ '--bar-color': 'var(--info)' }}>
            <div className="stat-num" style={{ color: 'var(--info)' }}>
              {logs.length}
            </div>
            <div className="stat-lbl">Executed Actions</div>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">Active Autopilot Brands</div>
          <span className="badge badge-primary badge-outline">{brands.length} Active</span>
        </div>
        {brands.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '0.86rem' }}>
            No brands currently have Autonomous Campaign Loops enabled. Enable it in the Dashboard's Campaign Brief.
          </div>
        ) : (
          <div className="list-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {brands.map((b, i) => (
              <div className="list-item" key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text)' }}>{b.brand_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 4 }}>
                    Industry: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{b.industry}</span> | Tone: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{b.tone}</span> | Goal: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{b.campaign_goal}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text3)', marginTop: 4 }}>
                    Interval: Every {b.autonomous_interval_hours} hours | Last executed: {formatTime(b.last_autonomous_run_at)}
                  </div>
                </div>
                <div>
                  <button 
                    className="btn btn-primary btn-sm"
                    disabled={triggeringBrand === b.brand_name}
                    onClick={() => triggerRun(b.brand_name)}
                  >
                    {triggeringBrand === b.brand_name ? (
                      <><span className="loading loading-spinner loading-xs" /> Deploying...</>
                    ) : 'Trigger Auto Run Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Agent Audit Log</div>
          <span className="badge badge-outline">Past Actions</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '0.86rem' }}>
            No autonomous actions logged yet. Start auto run to populate logs.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)', color: 'var(--text2)' }}>
                  <th style={{ padding: '12px 8px' }}>Timestamp</th>
                  <th style={{ padding: '12px 8px' }}>Brand</th>
                  <th style={{ padding: '12px 8px' }}>Action</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  let statusColor = 'var(--text3)'
                  if (log.status === 'success') statusColor = 'var(--green)'
                  if (log.status === 'failed') statusColor = 'var(--red)'
                  if (log.status === 'started') statusColor = 'var(--blue)'
                  
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{formatTime(log.timestamp)}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{log.brand_name}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'JetBrains Mono', fontSize: '0.74rem' }}>{log.action_type}</td>
                      <td style={{ padding: '12px 8px', color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>{log.status}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text2)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
