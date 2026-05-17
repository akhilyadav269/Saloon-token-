import { useEffect, useRef } from 'react'
import { sendNotification } from './notifications'

/**
 * useNotifyOnTurn
 * Watches the queue live and sends a browser notification
 * when the customer's wait drops to ≤ 10 minutes.
 */
export const useNotifyOnTurn = ({ saloon, tokens, myToken }) => {
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!myToken || !saloon || !tokens.length) return
    if (notifiedRef.current) return

    // Find how many people are ahead in 'waiting' status
    const ahead = tokens.filter(
      t => t.status === 'waiting' && t.tokenNumber < myToken.tokenNumber
    ).length

    const waitMins = ahead * (saloon.perPersonTime || 20)

    if (waitMins <= 10) {
      const msg =
        ahead === 0
          ? "It's your turn! Please come to the saloon now. 🪒"
          : `Only ${ahead} person${ahead > 1 ? 's' : ''} ahead — ~${waitMins} min. Head to ${saloon.name} now!`

      sendNotification(saloon.name, msg)
      notifiedRef.current = true
    }
  }, [tokens, myToken, saloon])
}
