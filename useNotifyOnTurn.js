import { useEffect, useRef } from 'react'
import { sendNotification } from './notifications'

export const useNotifyOnTurn = ({ saloon, tokens, myToken }) => {
  const notifiedRef = useRef(false)

  useEffect(() => {
    try {
      if (!myToken || !saloon || !tokens.length) return
      if (notifiedRef.current) return

      const ahead = tokens.filter(
        t => t.status === 'waiting' && t.tokenNumber < myToken.tokenNumber
      ).length

      const waitMins = ahead * (saloon.perPersonTime || 20)

      if (waitMins <= 10) {
        const msg =
          ahead === 0
            ? "It's your turn! Please come to the saloon now. 🪒"
            : `Only ${ahead} person${ahead > 1 ? 's' : ''} ahead — ~${waitMins} min. Head to ${saloon.name} now!`

        try { sendNotification(saloon.name, msg) } catch(e) {}
        notifiedRef.current = true
      }
    } catch(e) {
      console.error('useNotifyOnTurn error:', e)
    }
  }, [tokens, myToken, saloon])
}
