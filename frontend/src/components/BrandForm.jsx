import React, { useState } from 'react'

const PLATFORMS  = [
  { id:'linkedin', label:'LinkedIn', logo:'LinkedIn' },
  { id:'twitter', label:'Twitter', logo:'Twitter' },
  { id:'facebook', label:'Facebook', logo:'Facebook' },
  { id:'youtube', label:'YouTube', logo:'YouTube' },
  { id:'buffer', label:'Buffer', logo:'Buffer' },
]
const TONES      = ['casual','professional','inspirational','witty','educational']
const GOALS      = ['awareness','engagement','conversion','retention']
const INDUSTRIES = ['general','tech','fashion','food','fitness','business','education']

const PLAT_COLORS = {
  Instagram: '#e1306c',
  LinkedIn:  '#0ea5e9',
  Twitter:  '#e5e5e5',
  YouTube: '#ff0000',
  Facebook:  '#1877f2',
}

const getPlatformLogo = (platform) => {
  const logos = {
    Instagram: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="4.5"/>
        <circle cx="12" cy="12" r="3.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="#e1306c" stroke="none"/>
      </svg>
    ),
    LinkedIn: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0ea5e9"/>
        <circle cx="8.5" cy="8" r="1.5" fill="white"/>
        <rect x="7" y="10" width="3" height="8" fill="white"/>
        <path d="M13 10h3v1.5c.5-1 1.8-1.7 3-1.5 2.5.2 3.5 1.8 3.5 4.5V18h-3v-3.5c0-1-.4-1.8-1.5-1.8s-1.5.8-1.5 1.8V18h-3.5V10z" fill="white"/>
      </svg>
    ),
    Twitter: (
      <svg viewBox="0 0 24 24" fill="#e5e5e5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.802-5.974 6.802H2.42l7.728-8.835L1.254 2.25h6.554l4.702 6.202 5.44-6.202zM17.394 19.366h1.823L6.162 4.156H4.22l13.174 15.21z"/>
      </svg>
    ),
    YouTube: (
      <svg viewBox="0 0 24 24" fill="#ff0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    Facebook: (
      <svg viewBox="0 0 24 24" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
        <circle cx="12" cy="12" r="12" fill="#1877f2"/>
        <path d="M16.671 15.469l.469-3.047h-2.927v-1.977c0-.833.408-1.644 1.719-1.644h1.33V6.324s-1.207-.206-2.361-.206c-2.409 0-3.984 1.46-3.984 4.104v2.323H8.078v3.047h2.839v7.365a12.1 12.1 0 0 0 3.75 0v-7.365h2.004z" fill="white"/>
      </svg>
    ),
    Buffer: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  }
  return logos[platform]
}

const titleCase = value => value.replace(/\b\w/g, c => c.toUpperCase())

export default function BrandForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    brand_name:'', target_audience:'', platforms:['linkedin','twitter','facebook','youtube'],
    competitors:'', tone:'casual', offer:'',
    campaign_goal:'awareness', industry:'general', constraints:'',
    autonomous: false, autonomous_interval_hours: 24
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const togglePlat = p => setForm(f => ({
    ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p]
  }))

  const submit = e => {
    e.preventDefault()
    const payload = {
      ...form,
      competitors: Array.isArray(form.competitors)
        ? form.competitors
        : (form.competitors || '').split(',').map(s => s.trim()).filter(Boolean),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={submit}>
      <div className="card bg-base-100">
        <div className="card-head">
          <div>
            <div className="card-title launch-title">Launch A Campaign</div>
            <div className="card-sub">Share The Brand Basics And The Agent Team Will Turn Them Into A Social Plan.</div>
          </div>
          <span className="badge badge-primary badge-outline">Brief</span>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Brand Name</label>
            <input className="input input-bordered" value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="NovaBrew" required />
          </div>
          <div className="field">
            <label>Audience</label>
            <input className="input input-bordered" value={form.target_audience} onChange={e => set('target_audience', e.target.value)} placeholder="Gen Z Coffee Lovers" required />
          </div>
          <div className="field">
            <label>Industry</label>
            <select className="select select-bordered" value={form.industry} onChange={e => set('industry', e.target.value)}>
              {INDUSTRIES.map(i => <option key={i} value={i}>{titleCase(i)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Campaign Goal</label>
            <select className="select select-bordered" value={form.campaign_goal} onChange={e => set('campaign_goal', e.target.value)}>
              {GOALS.map(g => <option key={g} value={g}>{titleCase(g)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Brand Tone</label>
            <select className="select select-bordered" value={form.tone} onChange={e => set('tone', e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Offer Or Product</label>
            <input className="input input-bordered" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="Cold Brew Subscription Box" />
          </div>
          <div className="field form-full">
            <label>Competitors</label>
            <input className="input input-bordered" value={form.competitors} onChange={e => set('competitors', e.target.value)} placeholder="Starbucks, Blue Tokai, Third Wave Coffee" />
          </div>
          <div className="field form-full">
            <label>Guardrails</label>
            <textarea className="textarea textarea-bordered" value={form.constraints} onChange={e => set('constraints', e.target.value)} placeholder="Avoid Political Content, Keep Spend Under Rs. 10k, Stay Playful But Not Edgy." />
          </div>
          <div className="field form-full">
            <label>Platforms</label>
            <div className="platform-row">
              {PLATFORMS.map(p => (
                <button type="button" key={p.id} className={`platform-btn btn btn-sm ${form.platforms.includes(p.id) ? 'btn-primary' : 'btn-outline'}`} onClick={() => togglePlat(p.id)}>
                  <span className="platform-logo">{getPlatformLogo(p.logo)}</span>
                  {p.label}
                  <span className="platform-code">{p.id}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="field form-full" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: form.autonomous ? '12px' : '0' }}>
              <input 
                type="checkbox" 
                className="checkbox checkbox-primary" 
                id="autonomous"
                checked={form.autonomous} 
                onChange={e => set('autonomous', e.target.checked)} 
              />
              <div>
                <label htmlFor="autonomous" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', cursor: 'pointer' }}>Enable Autonomous Agent Loop</label>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>The 13-agent team will run campaigns and reply to comments automatically in the background.</div>
              </div>
            </div>
            {form.autonomous && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '32px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Execution Frequency:</label>
                <select 
                  className="select select-bordered select-sm" 
                  value={form.autonomous_interval_hours} 
                  onChange={e => set('autonomous_interval_hours', parseInt(e.target.value))}
                >
                  <option value={1}>Every 1 Hour (Testing)</option>
                  <option value={6}>Every 6 Hours</option>
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Every 24 Hours (Daily)</option>
                  <option value={48}>Every 48 Hours</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary btn-wide run-button" type="submit" disabled={loading || !form.brand_name || !form.target_audience}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : null}
          {loading ? 'Agents Are Working...' : 'Run The Agent Team'}
        </button>
      </div>
    </form>
  )
}
