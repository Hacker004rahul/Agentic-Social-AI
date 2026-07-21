import React from 'react'

export default function BrandVoicePanel({ brandVoice }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Brand Voice</div>
        <div className="page-sub">Tone consistency across all generated content</div>
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, padding:'16px 18px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'var(--r)' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>◎</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', textTransform:'capitalize' }}>{brandVoice.tone} Tone</div>
            <div style={{ fontSize:'0.75rem', color: brandVoice.flags.length === 0 ? 'var(--green)' : 'var(--yellow)', marginTop:3 }}>{brandVoice.status}</div>
          </div>
          <span className={`badge ${brandVoice.flags.length === 0 ? 'b-green' : 'b-amber'}`} style={{ marginLeft:'auto' }}>
            {brandVoice.flags.length === 0 ? '✓ Consistent' : `${brandVoice.flags.length} Issues`}
          </span>
        </div>

        <div style={{ background:'var(--s2)', borderRadius:'var(--r2)', padding:'12px 15px', fontSize:'0.8rem', color:'var(--text2)', lineHeight:1.7, marginBottom:18 }}>
          {brandVoice.style_guide}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <div style={{ fontSize:'0.65rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>✓ Use These</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {brandVoice.prefer.map((p, i) => <span key={i} className="badge b-green">{p}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:'0.65rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>✗ Avoid These</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {brandVoice.avoid.map((a, i) => <span key={i} className="badge b-red">{a}</span>)}
            </div>
          </div>
        </div>

        {brandVoice.flags.length > 0 && (
          <>
            <div className="divider" />
            <div style={{ fontSize:'0.75rem', color:'var(--text3)', marginBottom:10, fontWeight:700 }}>⚠ Tone Issues</div>
            {brandVoice.flags.map((f, i) => (
              <div className="list-item" key={i} style={{ borderLeftColor:'var(--yellow)' }}>
                <strong style={{ color:'var(--text)' }}>{f.platform}</strong> — {f.issue}
                <div style={{ marginTop:4, color:'var(--text3)', fontSize:'0.75rem' }}>Fix: {f.fix}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
