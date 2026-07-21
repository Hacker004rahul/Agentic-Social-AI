import React, { useState } from 'react'

const SENT = {
  positive: { cls:'badge-success', label:'Positive', accent:'var(--green)' },
  negative: { cls:'badge-error',   label:'Negative', accent:'var(--red)' },
  question: { cls:'badge-neutral', label:'Question', accent:'var(--text2)' },
}
const PLAT_C = { Instagram:'#e1306c', LinkedIn:'#0ea5e9', Twitter:'#e5e5e5', TikTok:'#ff0050', YouTube:'#ff0000', Facebook:'#1877f2' }

export default function InboxPanel({ inbox }) {
  const [copied, setCopied] = useState(null)
  const copy = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500) }
  const s = inbox.sentiment_summary

  return (
    <div>
      <div className="page-header">
        <div className="page-title">AI Copilot Inbox</div>
        <div className="page-sub">Review Suggested Replies, Then Copy Or Adapt Them Before Sending.</div>
      </div>

      <div className="stat-grid">
        {[
          { label:'Unread',    value: inbox.unread_count, bar:'var(--blue)' },
          { label:'Positive',  value: s.positive,         bar:'var(--green)' },
          { label:'Negative',  value: s.negative,         bar:'var(--red)' },
          { label:'Questions', value: s.question,         bar:'var(--text2)' },
        ].map((m, i) => (
          <div className="stat-box" key={i} style={{ '--bar-color': m.bar }}>
            <div className="stat-num" style={{ color: m.bar }}>{m.value}</div>
            <div className="stat-lbl">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Comments</div>
          <span className="badge badge-primary badge-outline">{inbox.comments.length} New</span>
        </div>
        {inbox.comments.map((c, i) => {
          const st = SENT[c.sentiment] || SENT.positive
          return (
            <div className="msg-card" key={i} style={{ borderLeft:`3px solid ${st.accent}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--s3)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'var(--text2)', flexShrink:0 }}>
                  {c.user[1]?.toUpperCase()}
                </div>
                <span style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text)' }}>{c.user}</span>
                <span style={{ color: PLAT_C[c.platform], fontSize:'0.72rem', fontWeight:700 }}>{c.platform}</span>
                <span className={`badge badge-outline ${st.cls}`}>{st.label}</span>
                <span style={{ marginLeft:'auto', fontSize:'0.68rem', color:'var(--text3)' }}>{c.time}</span>
              </div>
              <div style={{ fontSize:'0.86rem', color:'var(--text)', marginBottom:8, lineHeight:1.5 }}>{c.message}</div>
              <div className="reply-box">
                <span style={{ fontSize:'0.62rem', color:'var(--text3)', textTransform:'capitalize', letterSpacing:'0.06em', marginRight:6 }}>Suggested Reply</span>
                {c.smart_reply}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => copy(c.smart_reply, i)}>
                {copied === i ? 'Copied' : 'Copy Reply'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Direct Messages</div>
          <span className="badge badge-info badge-outline">{inbox.dms.length} Unread</span>
        </div>
        {inbox.dms.map((d, i) => (
          <div className="list-item" key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
              <span style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text)' }}>{d.from}</span>
              <span style={{ fontSize:'0.68rem', color:'var(--text3)' }}>{d.time}</span>
            </div>
            <div style={{ fontSize:'0.82rem', color:'var(--text2)', lineHeight:1.5 }}>{d.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
