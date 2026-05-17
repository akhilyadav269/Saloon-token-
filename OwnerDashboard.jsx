import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useSaloon, useTokens, markPresent, skipToken, nextToken, updateSaloon, getReports } from './useSaloon'
import { useMidnightReset } from './useMidnightReset'
import { useBookingStatus } from './useBookingStatus'
import { formatDate, formatMinutes } from './helpers'
import { sendNotification } from './notifications'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import dayjs from 'dayjs'

const THEMES = ['#d4af37','#e74c3c','#2ecc71','#3498db','#9b59b6','#e67e22','#1abc9c','#e91e63']

export default function OwnerDashboard() {
  const { saloonId } = useParams()
  const { ownerSession, loginOwner, logoutOwner } = useAuth()
  const { saloon, loading } = useSaloon(saloonId)
  const { tokens } = useTokens(saloonId)
  const { open } = useBookingStatus(saloon)
  const navigate = useNavigate()

  const isOwner = ownerSession?.saloonId === saloonId

  // Midnight reset runs while owner is logged in
  useMidnightReset(isOwner ? saloonId : null)

  const [tab, setTab] = useState('tokens')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [reports, setReports] = useState({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [settings, setSettings] = useState(null)
  const [newService, setNewService] = useState('')
  const [holidayForm, setHolidayForm] = useState({ type: 'single', date: '', start: '', end: '' })
  const qrCardRef = useRef(null)

  useEffect(() => {
    if (saloon && !settings) {
      setSettings({
        name: saloon.name || '',
        ownerPhone: saloon.ownerPhone || '',
        colorTheme: saloon.colorTheme || '#d4af37',
        perPersonTime: saloon.perPersonTime || 20,
        openTime: saloon.openTime || '09:00',
        closeTime: saloon.closeTime || '21:00',
        services: [...(saloon.services || [])],
      })
    }
  }, [saloon])

  useEffect(() => {
    if (isOwner && tab === 'reports') getReports(saloonId).then(setReports).catch(() => toast.error('Failed to load reports'))
  }, [isOwner, tab])

  const handleLogin = (e) => {
    e.preventDefault()
    if (loginForm.email === saloon.ownerEmail && loginForm.password === saloon.ownerPassword) {
      loginOwner(saloonId, loginForm.email)
      toast.success('Welcome back!')
    } else {
      toast.error('Invalid credentials')
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try { await updateSaloon(saloonId, settings); toast.success('Settings saved!') }
    catch { toast.error('Save failed') }
    setSavingSettings(false)
  }

  const addService = () => {
    if (!newService.trim()) return
    setSettings(s => ({ ...s, services: [...s.services, newService.trim()] }))
    setNewService('')
  }

  const removeService = (i) =>
    setSettings(s => ({ ...s, services: s.services.filter((_, idx) => idx !== i) }))

  const addHoliday = async () => {
    if (holidayForm.type === 'single' && !holidayForm.date) return toast.error('Select a date')
    if (holidayForm.type === 'range' && (!holidayForm.start || !holidayForm.end)) return toast.error('Select range')
    const h = holidayForm.type === 'single'
      ? { type: 'single', date: holidayForm.date, id: Date.now() }
      : { type: 'range', start: holidayForm.start, end: holidayForm.end, id: Date.now() }
    try {
      await updateSaloon(saloonId, { holidays: [...(saloon.holidays || []), h] })
      toast.success('Holiday added!')
      setHolidayForm({ type: 'single', date: '', start: '', end: '' })
    } catch { toast.error('Failed') }
  }

  const removeHoliday = async (id) => {
    try { await updateSaloon(saloonId, { holidays: saloon.holidays.filter(h => h.id !== id) }) }
    catch { toast.error('Failed') }
  }

  const handleNext = async (currentTok) => {
    try {
      await nextToken(saloonId, currentTok?.id)
      toast.success('Next token!')
    } catch { }
  }

  const handleSkip = async (token) => {
    try {
      await skipToken(saloonId, token.id)
      sendNotification(saloon.name, 'Token #' + token.tokenNumber + ' was skipped.')
      toast.success('Token #' + token.tokenNumber + ' skipped')
    } catch { toast.error('Failed') }
  }

  const handlePresent = async (token) => {
    try { await markPresent(saloonId, token.id); toast.success('#' + token.tokenNumber + ' marked present') }
    catch { toast.error('Failed') }
  }

  const downloadQRCard = async () => {
    const url = window.location.origin + '/saloon/' + saloonId
    try {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, url, {
        width: 280, margin: 2,
        color: { dark: '#0d0d0d', light: '#f5f0e8' }
      })
      const qrDataUrl = canvas.toDataURL()
      const img = qrCardRef.current?.querySelector('.qr-img')
      if (img) {
        img.src = qrDataUrl
        await new Promise(resolve => { img.onload = resolve; img.onerror = resolve })
      }
      await new Promise(r => setTimeout(r, 300))
      const capture = await html2canvas(qrCardRef.current, { scale: 3, useCORS: true, backgroundColor: null })
      const link = document.createElement('a')
      link.download = (saloon.name || 'saloon').replace(/\s+/g, '-') + '-QR-Card.png'
      link.href = capture.toDataURL('image/png')
      link.click()
      toast.success('QR Card downloaded!')
    } catch (err) { toast.error('Download failed: ' + err.message) }
  }

  const theme = saloon?.colorTheme || '#d4af37'
  const waitingTokens = tokens.filter(t => t.status === 'waiting')
  const presentToken = tokens.find(t => t.status === 'present')
  const completedToday = tokens.filter(t => t.status === 'completed').length

  // ── LOGIN SCREEN ───────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-gold-400 font-body animate-pulse">Loading...</div>
    </div>
  )

  if (!saloon) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <p className="text-white font-body">Saloon not found</p>
    </div>
  )

  if (!isOwner) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💈</div>
          <h1 className="font-display text-2xl text-white">{saloon.name}</h1>
          <p className="text-dark-400 font-body text-sm mt-1">Owner Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-dark-300 font-body text-sm mb-1.5">Email</label>
            <input type="email" placeholder="owner@example.com" value={loginForm.email}
              onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white font-body focus:outline-none transition-colors"
              onFocus={e => e.target.style.borderColor = theme}
              onBlur={e => e.target.style.borderColor = '#333'} required />
          </div>
          <div>
            <label className="block text-dark-300 font-body text-sm mb-1.5">Password</label>
            <input type="password" placeholder="••••••••" value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white font-body focus:outline-none transition-colors"
              onFocus={e => e.target.style.borderColor = theme}
              onBlur={e => e.target.style.borderColor = '#333'} required />
          </div>
          <button type="submit"
            className="w-full font-body font-semibold py-3.5 rounded-xl text-dark-900 transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme }}>
            Login to Dashboard
          </button>
        </form>
        <button onClick={() => navigate('/saloon/' + saloonId)}
          className="w-full mt-3 text-dark-400 font-body text-sm hover:text-white transition-colors py-2">
          → View Customer Booking Page
        </button>
      </div>
    </div>
  )

  // ── DASHBOARD ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Top Bar */}
      <div className="bg-dark-800 border-b border-dark-600 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme }} />
            <span className="font-display text-lg text-white">{saloon.name}</span>
            <span className={`text-xs font-body px-2.5 py-0.5 rounded-full border ${open ? 'border-green-700/40 bg-green-900/20 text-green-400' : 'border-red-800/40 bg-red-900/20 text-red-400'}`}>
              {open ? '● Open' : '● Closed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/saloon/' + saloonId)}
              className="text-dark-400 hover:text-white font-body text-sm px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
              Booking Page →
            </button>
            <button onClick={logoutOwner}
              className="text-dark-400 hover:text-red-400 font-body text-sm px-3 py-1.5 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-800 border-b border-dark-600 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar">
          {[['tokens','🎫 Tokens'],['settings','⚙️ Settings'],['holidays','📅 Holidays'],['reports','📊 Reports']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-5 py-3.5 font-body text-sm whitespace-nowrap border-b-2 transition-colors flex-shrink-0"
              style={{
                borderColor: tab === k ? theme : 'transparent',
                color: tab === k ? '#fff' : '#666'
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">

        {/* ── TOKENS TAB ── */}
        {tab === 'tokens' && (
          <div className="space-y-4 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Waiting', val: waitingTokens.length, color: '#f59e0b' },
                { label: 'Serving', val: presentToken ? 1 : 0, color: '#4ade80' },
                { label: 'Done Today', val: completedToday, color: '#60a5fa' },
              ].map(s => (
                <div key={s.label} className="bg-dark-800 border border-dark-600 rounded-xl p-4 text-center">
                  <div className="font-display text-3xl" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-dark-400 font-body text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Currently Serving */}
            {presentToken ? (
              <div className="bg-dark-800 rounded-2xl p-5 border-2 animate-pulse-gold" style={{ borderColor: theme + '50' }}>
                <div className="text-dark-400 font-body text-xs uppercase tracking-wider mb-3">Now Serving</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-6xl" style={{ color: theme, lineHeight: 1 }}>
                      #{presentToken.tokenNumber}
                    </div>
                    <div className="text-white font-body font-medium mt-2">{presentToken.name}</div>
                    <div className="text-dark-400 font-body text-sm">{presentToken.phone}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handlePresent(waitingTokens[0])}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-dark-900 transition-opacity hover:opacity-90"
                      style={{ backgroundColor: theme }}>
                      ▶ Next
                    </button>
                    <a href={'tel:' + presentToken.phone}
                      className="px-6 py-2.5 rounded-xl bg-dark-600 hover:bg-dark-500 text-white font-body text-sm text-center transition-colors">
                      📞 Call
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              waitingTokens.length > 0 && (
                <button onClick={() => handleNext(null)}
                  className="w-full py-4 rounded-2xl font-body font-semibold text-dark-900 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme }}>
                  ▶ Serve Next Token
                </button>
              )
            )}

            {/* Waiting Queue */}
            <div>
              <div className="text-dark-400 font-body text-xs uppercase tracking-wider mb-3">
                Waiting Queue ({waitingTokens.length})
              </div>
              {waitingTokens.length === 0 ? (
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-10 text-center text-dark-500 font-body text-sm">
                  Queue is empty
                </div>
              ) : (
                <div className="space-y-2">
                  {waitingTokens.map((token, idx) => (
                    <div key={token.id} className="bg-dark-800 border border-dark-600 rounded-xl p-4 flex items-center gap-3 hover:border-dark-400 transition-colors">
                      <div className="font-display text-2xl w-14 text-center flex-shrink-0" style={{ color: theme }}>
                        #{token.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-body font-medium text-sm truncate">{token.name}</div>
                        <div className="text-dark-400 font-body text-xs">{token.phone}</div>
                        <div className="text-dark-500 font-body text-xs">
                          {idx === 0 ? 'Next up' : '~' + formatMinutes(idx * (saloon.perPersonTime || 20)) + ' wait'}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handlePresent(token)} title="Mark Present"
                          className="bg-green-900/30 hover:bg-green-900/50 text-green-400 text-sm w-9 h-9 rounded-lg transition-colors flex items-center justify-center">
                          ✅
                        </button>
                        <button onClick={() => handleSkip(token)} title="Skip"
                          className="bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 text-sm w-9 h-9 rounded-lg transition-colors flex items-center justify-center">
                          ⏭
                        </button>
                        <a href={'tel:' + token.phone} title="Call"
                          className="bg-dark-700 hover:bg-dark-600 text-white text-sm w-9 h-9 rounded-lg transition-colors flex items-center justify-center">
                          📞
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skipped/Cancelled today */}
            {tokens.filter(t => t.status === 'skipped' || t.status === 'cancelled').length > 0 && (
              <details className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 text-dark-400 font-body text-sm cursor-pointer hover:text-white transition-colors">
                  Skipped / Cancelled ({tokens.filter(t => t.status === 'skipped' || t.status === 'cancelled').length})
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {tokens.filter(t => t.status === 'skipped' || t.status === 'cancelled').map(token => (
                    <div key={token.id} className="flex items-center gap-3 py-2 border-t border-dark-700">
                      <div className="font-mono text-sm text-dark-500 w-10">#{token.tokenNumber}</div>
                      <div className="flex-1">
                        <div className="text-dark-300 font-body text-sm">{token.name}</div>
                        <div className="text-dark-500 font-body text-xs">{token.phone}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-body ${token.status === 'skipped' ? 'bg-yellow-900/30 text-yellow-600' : 'bg-red-900/30 text-red-600'}`}>
                        {token.status}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && settings && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Saloon Name', key: 'name' },
                { label: 'Owner Phone', key: 'ownerPhone' },
                { label: 'Open Time', key: 'openTime', type: 'time' },
                { label: 'Close Time', key: 'closeTime', type: 'time' },
                { label: 'Minutes Per Person', key: 'perPersonTime', type: 'number' },
              ].map(({ label, key, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-dark-300 font-body text-sm mb-1.5">{label}</label>
                  <input type={type} value={settings[key]}
                    onChange={e => setSettings(s => ({ ...s, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none transition-colors"
                    onFocus={e => e.target.style.borderColor = theme}
                    onBlur={e => e.target.style.borderColor = '#333'} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-dark-300 font-body text-sm mb-2.5">Color Theme</label>
              <div className="flex flex-wrap gap-3">
                {THEMES.map(c => (
                  <button key={c} onClick={() => setSettings(s => ({ ...s, colorTheme: c }))}
                    className="w-10 h-10 rounded-full transition-all hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c,
                      outline: settings.colorTheme === c ? '3px solid #fff' : 'none',
                      outlineOffset: '3px',
                      boxShadow: settings.colorTheme === c ? `0 0 12px ${c}80` : 'none'
                    }} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-dark-300 font-body text-sm mb-2">Services</label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                {settings.services.map((s, i) => (
                  <span key={i} className="bg-dark-700 text-white font-body text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    {s}
                    <button onClick={() => removeService(i)} className="text-dark-400 hover:text-red-400 transition-colors text-base leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newService} onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                  placeholder="Add new service..."
                  className="flex-1 bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none transition-colors"
                  onFocus={e => e.target.style.borderColor = theme}
                  onBlur={e => e.target.style.borderColor = '#333'} />
                <button onClick={addService}
                  className="bg-dark-700 hover:bg-dark-600 text-white font-body text-sm px-4 py-2.5 rounded-xl transition-colors border border-dark-500">
                  + Add
                </button>
              </div>
            </div>

            <button onClick={saveSettings} disabled={savingSettings}
              className="w-full py-3.5 rounded-xl font-body font-semibold text-dark-900 transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: theme }}>
              {savingSettings ? 'Saving...' : '💾 Save Settings'}
            </button>

            {/* QR Card Section */}
            <div className="border-t border-dark-600 pt-6">
              <h3 className="text-white font-body font-medium mb-4">QR Code Card</h3>
              <p className="text-dark-400 font-body text-xs mb-5">Download a print-ready QR card for your saloon front desk.</p>

              {/* Card Preview */}
              <div ref={qrCardRef}
                style={{
                  background: 'linear-gradient(145deg, #0a0a0a 0%, #141414 100%)',
                  border: '3px solid ' + theme,
                  borderRadius: '24px',
                  padding: '36px 28px',
                  textAlign: 'center',
                  maxWidth: '320px',
                  margin: '0 auto',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                {/* Decorative corner */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${theme}, transparent)` }} />

                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✂️</div>
                <div style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '4px'
                }}>{saloon.name}</div>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '24px', fontFamily: 'sans-serif' }}>
                  Skip the wait — Book Online
                </div>

                <div style={{ background: '#f5f0e8', borderRadius: '16px', padding: '14px', display: 'inline-block', marginBottom: '18px' }}>
                  <img className="qr-img" src="/favicon.svg" alt="QR Code"
                    style={{ width: '180px', height: '180px', display: 'block' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ height: '1px', flex: 1, background: '#333' }} />
                  <div style={{ color: theme, fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Scan Me
                  </div>
                  <div style={{ height: '1px', flex: 1, background: '#333' }} />
                </div>
                <div style={{ color: '#666', fontSize: '11px', fontFamily: 'sans-serif' }}>
                  Book your token • No waiting in line
                </div>
              </div>

              <button onClick={downloadQRCard}
                className="mt-5 w-full max-w-xs mx-auto block py-3 rounded-xl font-body font-semibold text-dark-900 transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme }}>
                ⬇ Download QR Card PNG
              </button>
            </div>
          </div>
        )}

        {/* ── HOLIDAYS TAB ── */}
        {tab === 'holidays' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
              <h3 className="text-white font-body font-medium mb-4">Add Holiday / Day Off</h3>
              <div className="flex gap-2 mb-4">
                {[['single','Single Day'],['range','Date Range']].map(([t, label]) => (
                  <button key={t} onClick={() => setHolidayForm(f => ({ ...f, type: t }))}
                    className="px-4 py-2 rounded-lg font-body text-sm transition-all"
                    style={{
                      backgroundColor: holidayForm.type === t ? theme : '#252525',
                      color: holidayForm.type === t ? '#0d0d0d' : '#888',
                      fontWeight: holidayForm.type === t ? 600 : 400
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {holidayForm.type === 'single' ? (
                <input type="date" value={holidayForm.date}
                  onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none mb-4 transition-colors"
                  onFocus={e => e.target.style.borderColor = theme}
                  onBlur={e => e.target.style.borderColor = '#333'} />
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-dark-400 font-body text-xs mb-1">From</label>
                    <input type="date" value={holidayForm.start}
                      onChange={e => setHolidayForm(f => ({ ...f, start: e.target.value }))}
                      className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-white font-body text-sm focus:outline-none transition-colors"
                      onFocus={e => e.target.style.borderColor = theme}
                      onBlur={e => e.target.style.borderColor = '#333'} />
                  </div>
                  <div>
                    <label className="block text-dark-400 font-body text-xs mb-1">To</label>
                    <input type="date" value={holidayForm.end}
                      onChange={e => setHolidayForm(f => ({ ...f, end: e.target.value }))}
                      className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-white font-body text-sm focus:outline-none transition-colors"
                      onFocus={e => e.target.style.borderColor = theme}
                      onBlur={e => e.target.style.borderColor = '#333'} />
                  </div>
                </div>
              )}

              <button onClick={addHoliday}
                className="w-full py-3 rounded-xl font-body font-semibold text-dark-900 transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme }}>
                + Add Holiday
              </button>
            </div>

            <div>
              <div className="text-dark-400 font-body text-xs uppercase tracking-wider mb-3">Scheduled Holidays</div>
              {(saloon.holidays || []).length === 0 ? (
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-10 text-center text-dark-500 font-body text-sm">
                  No holidays scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {(saloon.holidays || []).map(h => (
                    <div key={h.id} className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-body text-white text-sm">
                          {h.type === 'single' ? '📅 ' + formatDate(h.date) : '📅 ' + formatDate(h.start) + ' → ' + formatDate(h.end)}
                        </div>
                        <div className="text-dark-500 font-body text-xs mt-0.5">
                          {h.type === 'single' ? 'Single day off' : 'Date range'}
                        </div>
                      </div>
                      <button onClick={() => removeHoliday(h.id)}
                        className="text-dark-500 hover:text-red-400 transition-colors font-body text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-dark-400 font-body text-sm">Last 3 days only — older reports are auto-deleted at midnight.</p>
              <button onClick={() => getReports(saloonId).then(setReports)} className="text-dark-400 hover:text-white font-body text-xs px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-600 transition-colors">
                ↻ Refresh
              </button>
            </div>
            {Object.keys(reports).length === 0 ? (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-10 text-center text-dark-500 font-body text-sm">
                No report data yet
              </div>
            ) : (
              Object.entries(reports).sort(([a],[b]) => b.localeCompare(a)).map(([date, r]) => (
                <div key={date} className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-body font-semibold text-white">{formatDate(date)}</div>
                    {date === dayjs().format('YYYY-MM-DD') && (
                      <span className="text-xs font-body px-2 py-0.5 rounded-full border border-green-700/40 bg-green-900/20 text-green-400">Today</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Total Booked', r.total, '#fff'],
                      ['Completed', r.completed, '#4ade80'],
                      ['Skipped', r.skipped, '#f59e0b'],
                      ['Cancelled', r.cancelled, '#f87171'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="bg-dark-700 rounded-xl p-3 text-center">
                        <div className="font-display text-3xl" style={{ color }}>{value}</div>
                        <div className="text-dark-400 font-body text-xs mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                  {r.total > 0 && (
                    <div className="mt-3 bg-dark-700 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-dark-400 font-body text-xs">Completion Rate</span>
                      <span className="text-white font-body text-sm font-medium">
                        {Math.round((r.completed / r.total) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
