import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSaloon, useTokens, bookToken, cancelToken, runLateToken } from './useSaloon'
import { useBookingStatus } from './useBookingStatus'
import { useNotifyOnTurn } from './useNotifyOnTurn'
import { formatTime, isHoliday, nextOpenDate, formatMinutes, formatDate } from './helpers'
import { requestPermission } from './notifications'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function BookingPage() {
  const { saloonId } = useParams()
  const { saloon, loading: saloonLoading } = useSaloon(saloonId)
  const { tokens } = useTokens(saloonId)
  const { open, holiday } = useBookingStatus(saloon)

  const [step, setStep] = useState('form') // form | booked
  const [form, setForm] = useState({ name: '', phone: '' })
  const [myToken, setMyToken] = useState(null)
  const [booking, setBooking] = useState(false)

  const theme = saloon?.colorTheme || '#d4af37'
  const nextDate = saloon ? nextOpenDate(saloon) : null

  // Notify when turn is near
  useNotifyOnTurn({ saloon, tokens, myToken })

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('myToken_' + saloonId)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.date === dayjs().format('YYYY-MM-DD')) {
          setMyToken(data)
          setStep('booked')
        } else {
          localStorage.removeItem('myToken_' + saloonId)
        }
      } catch { localStorage.removeItem('myToken_' + saloonId) }
    }
  }, [saloonId])

  // Sync myToken status from live tokens list
  useEffect(() => {
    if (!myToken || !tokens.length) return
    const live = tokens.find(t => t.id === myToken.id)
    if (live && (live.status === 'cancelled' || live.status === 'skipped')) {
      localStorage.removeItem('myToken_' + saloonId)
      setMyToken(null)
      setStep('form')
      toast('Your token was cancelled or skipped.', { icon: 'ℹ️' })
    }
  }, [tokens, myToken])

  const getPeopleAhead = useCallback(() => {
    if (!myToken) return 0
    return tokens.filter(t => t.status === 'waiting' && t.position < myToken.position).length
  }, [myToken, tokens])
const handleBook = async (e) => {
    e.preventDefault()
    setBooking(true)
    try {
      try { await requestPermission() } catch(e) {}
      const result = await bookToken(saloonId, form)
      const tokenData = { ...result, name: form.name, phone: form.phone, date: dayjs().format('YYYY-MM-DD') }
      setMyToken(tokenData)
      try { localStorage.setItem('myToken_' + saloonId, JSON.stringify(tokenData)) } catch(e) {}
      setStep('booked')
      toast.success('Token booked! 🎫')
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    }
    setBooking(false)
}
  const handleCancel = async () => {
    if (!myToken) return
    if (!confirm('Cancel your token?')) return
    try {
      await cancelToken(saloonId, myToken.id)
      localStorage.removeItem('myToken_' + saloonId)
      setMyToken(null)
      setStep('form')
      toast.success('Token cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  const handleRunLate = async () => {
    if (!myToken) return
    try {
      await runLateToken(saloonId, myToken.id)
      toast.success("Moved to last position — take your time!")
    } catch { toast.error('Failed') }
  }

  if (saloonLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">💈</div>
        <div className="text-gray-500 text-sm" style={{ fontFamily: '"DM Sans", sans-serif' }}>Loading...</div>
      </div>
    </div>
  )

  if (!saloon) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-400" style={{ fontFamily: '"DM Sans", sans-serif' }}>Saloon not found</p>
      </div>
    </div>
  )

  const ahead = getPeopleAhead()
  const workers = saloon.workers || 1
  const waitMins = Math.ceil(ahead / workers) * (saloon.perPersonTime || 20)
  const totalWaiting = tokens.filter(t => t.status === 'waiting').length

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: theme }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-[0.04] blur-[60px]"
          style={{ background: theme }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative max-w-md mx-auto min-h-screen flex flex-col px-5">

        {/* ── HEADER ── */}
        <div className="pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 border"
            style={{ background: theme + '15', borderColor: theme + '30' }}>
            <span className="text-3xl">💈</span>
          </div>

          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            {saloon.name}
          </h1>

          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border"
            style={{
              background: open ? '#14532d30' : '#7f1d1d30',
              borderColor: open ? '#16a34a40' : '#dc262640',
              color: open ? '#4ade80' : '#f87171'
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: open ? '#4ade80' : '#f87171' }} />
            {open ? 'Open for Bookings' : 'Currently Closed'}
          </div>

          <p className="text-gray-500 text-xs mt-2">
            {formatTime(saloon.openTime)} – {formatTime(saloon.closeTime)}
          </p>
        </div>

        {/* ── MAIN ── */}
        <div className="flex-1 pb-10 space-y-4">

          {/* Holiday Banner */}
          {holiday && (
            <div className="rounded-2xl p-5 text-center border border-yellow-900/30 bg-yellow-900/10">
              <div className="text-3xl mb-2">🏖️</div>
              <p className="text-yellow-300 font-semibold">Saloon is closed today</p>
              {nextDate && (
                <p className="text-gray-400 text-sm mt-1">
                  Next available: <span className="text-white font-medium">{formatDate(nextDate)}</span>
                </p>
              )}
            </div>
          )}

          {/* Closed Banner */}
          {!holiday && !open && (
            <div className="rounded-2xl p-5 text-center border border-gray-800 bg-gray-900/40">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-gray-200 font-semibold">Saloon is closed</p>
              <p className="text-gray-500 text-sm mt-1">
                Booking opens at <span className="text-white">{formatTime(saloon.openTime)}</span>
                <span className="text-gray-600"> (30 min early)</span>
              </p>
            </div>
          )}

          {/* ── BOOKING FORM ── */}
          {step === 'form' && open && !holiday && (
            <div className="space-y-4 animate-slide-up">
              {/* Queue snapshot */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-gray-800 bg-gray-900/60 text-sm">
                <span className="text-gray-400">People waiting now</span>
                <span className="font-semibold tabular-nums" style={{ color: theme }}>
                  {totalWaiting}
                </span>
              </div>

              <form onSubmit={handleBook} className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Your Name</label>
                  <input type="text" placeholder="e.g. Ahmed Khan"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required autoComplete="name"
                    style={{ outline: 'none' }}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-base placeholder-gray-600 focus:border-gray-500 transition-colors"
                    onFocus={e => { e.target.style.borderColor = theme }}
                    onBlur={e => { e.target.style.borderColor = '#374151' }} />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Mobile Number</label>
                  <input type="tel" placeholder="e.g. 0300-1234567"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required autoComplete="tel"
                    style={{ outline: 'none' }}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-base placeholder-gray-600 transition-colors"
                    onFocus={e => { e.target.style.borderColor = theme }}
                    onBlur={e => { e.target.style.borderColor = '#374151' }} />
                  <p className="text-gray-600 text-xs mt-1.5">One token per number per day</p>
                </div>

                {/* Services */}
                {saloon.services?.length > 0 && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Services Available</label>
                    <div className="flex flex-wrap gap-2">
                      {saloon.services.map((s, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-300 bg-gray-900">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={booking}
                  className="w-full py-4 rounded-xl font-semibold text-base transition-opacity disabled:opacity-50 mt-2"
                  style={{ background: theme, color: '#0a0a0a' }}>
                  {booking ? 'Booking...' : 'Get My Token 🎫'}
                </button>
              </form>
            </div>
          )}

          {/* ── TOKEN DISPLAY ── */}
          {step === 'booked' && myToken && (
            <div className="space-y-4 animate-slide-up">
              {/* Big token card */}
              <div className="rounded-3xl p-8 text-center border-2 relative overflow-hidden"
                style={{ borderColor: theme + '50', background: 'linear-gradient(135deg, #0d0d0d 0%, #141414 100%)' }}>
                {/* Subtle radial glow inside card */}
                <div className="absolute inset-0 opacity-5 rounded-3xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${theme}, transparent 70%)` }} />
                <div className="relative">
                  <div className="text-gray-400 text-xs uppercase tracking-[0.25em] mb-2">Your Token</div>
                  <div style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '100px',
                    lineHeight: 1,
                    fontWeight: 900,
                    color: theme,
                    textShadow: `0 0 40px ${theme}40`
                  }}>
                    #{myToken.tokenNumber}
                  </div>
                  <div className="text-white text-lg mt-2 font-medium">{myToken.name}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{myToken.phone}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Ahead of You</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '40px', lineHeight: 1, color: theme }}>
                    {ahead}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">people</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Est. Wait</div>
                  <div style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: ahead === 0 ? '28px' : '40px',
                    lineHeight: 1,
                    color: ahead === 0 ? '#4ade80' : theme
                  }}>
                    {ahead === 0 ? '🪒 Now' : formatMinutes(waitMins)}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">{ahead === 0 ? 'your turn!' : 'approx.'}</div>
                </div>
              </div>

              {/* Live badge */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-500 text-xs">Queue updates live</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleRunLate}
                  className="py-3.5 rounded-xl text-sm font-medium bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-200 transition-colors">
                  ⏰ Running Late
                </button>
                <button onClick={handleCancel}
                  className="py-3.5 rounded-xl text-sm font-medium border border-red-900/40 bg-red-900/20 hover:bg-red-900/30 text-red-400 transition-colors">
                  ❌ Cancel Token
                </button>
              </div>

              <p className="text-center text-gray-600 text-xs">
                Browser notification 10 min before your turn 🔔
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="pb-8 pt-4 border-t border-gray-900 text-center">
          {saloon.ownerPhone && (
            <a href={'tel:' + saloon.ownerPhone}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm mb-2">
              <span>📞</span><span>{saloon.ownerPhone}</span>
            </a>
          )}
          <p className="text-gray-700 text-xs mt-1">Powered by Saloon Token System</p>
        </div>
      </div>
    </div>
  )
}
