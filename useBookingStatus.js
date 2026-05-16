import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { isBookingOpen, isHoliday } from '../utils/helpers'

/**
 * useBookingStatus
 * Re-evaluates every minute whether booking is open.
 * Returns: { open, holiday, minutesUntilOpen, minutesUntilClose }
 */
export const useBookingStatus = (saloon) => {
  const [status, setStatus] = useState({
    open: false,
    holiday: false,
    minutesUntilOpen: 0,
    minutesUntilClose: 0,
  })

  useEffect(() => {
    if (!saloon) return

    const evaluate = () => {
      const now = dayjs()
      const holiday = isHoliday(saloon)
      const open = isBookingOpen(saloon)

      const [oh, om] = saloon.openTime.split(':').map(Number)
      const [ch, cm] = saloon.closeTime.split(':').map(Number)
      const openMins = oh * 60 + om - 30 // 30 min early
      const closeMins = ch * 60 + cm
      const nowMins = now.hour() * 60 + now.minute()

      const minutesUntilOpen = open ? 0 : Math.max(0, openMins - nowMins)
      const minutesUntilClose = !open ? 0 : Math.max(0, closeMins - nowMins)

      setStatus({ open, holiday, minutesUntilOpen, minutesUntilClose })
    }

    evaluate()
    const interval = setInterval(evaluate, 60 * 1000) // check every minute
    return () => clearInterval(interval)
  }, [saloon])

  return status
}
