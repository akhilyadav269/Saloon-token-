import dayjs from 'dayjs'

export const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export const todayStr = () => dayjs().format('YYYY-MM-DD')

export const isHoliday = (saloon, date) => {
  const d = date || todayStr()
  return (saloon?.holidays || []).some((h) => {
    if (h.type === 'single') return h.date === d
    if (h.type === 'range') return d >= h.start && d <= h.end
    return false
  })
}

export const nextOpenDate = (saloon) => {
  let d = dayjs().add(1, 'day')
  for (let i = 0; i < 60; i++) {
    const str = d.format('YYYY-MM-DD')
    if (!isHoliday(saloon, str)) return str
    d = d.add(1, 'day')
  }
  return null
}

export const isBookingOpen = (saloon) => {
  if (!saloon) return false
  if (isHoliday(saloon)) return false
  const now = dayjs()
  const [oh, om] = saloon.openTime.split(':').map(Number)
  const [ch, cm] = saloon.closeTime.split(':').map(Number)
  const openMinutes = oh * 60 + om - 30
  const closeMinutes = ch * 60 + cm
  const nowMinutes = now.hour() * 60 + now.minute()
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
}

export const calcWaitTime = (position, perPersonTime) => position * perPersonTime

export const genSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const getThreeDaysAgo = () => dayjs().subtract(3, 'day').format('YYYY-MM-DD')

export const formatDate = (str) => dayjs(str).format('MMM D, YYYY')

export const formatMinutes = (mins) => {
  if (mins < 1) return 'Now'
  if (mins < 60) return mins + ' min'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h'
}
