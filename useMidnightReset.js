import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getThreeDaysAgo } from '../utils/helpers'

/**
 * useMidnightReset
 * Runs midnight cleanup for a saloon:
 *  1. Reset currentTokenCounter to 0
 *  2. Delete tokens older than 3 days
 * Call this inside OwnerDashboard so it only runs when owner is logged in.
 */
export const useMidnightReset = (saloonId) => {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!saloonId) return

    const scheduleReset = () => {
      const now = dayjs()
      const midnight = now.add(1, 'day').startOf('day')
      const msUntilMidnight = midnight.diff(now)

      timerRef.current = setTimeout(async () => {
        try {
          // 1. Reset token counter
          await updateDoc(doc(db, 'saloons', saloonId), {
            currentTokenCounter: 0,
          })

          // 2. Delete tokens older than 3 days
          const cutoff = getThreeDaysAgo()
          const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
          const oldQ = query(tokensRef, where('date', '<', cutoff))
          const oldSnap = await getDocs(oldQ)
          const deletions = oldSnap.docs.map(d => deleteDoc(d.ref))
          await Promise.all(deletions)

          console.log(`[MidnightReset] Done for ${saloonId}. Deleted ${oldSnap.size} old tokens.`)
        } catch (err) {
          console.error('[MidnightReset] Error:', err)
        }

        // Schedule next midnight reset
        scheduleReset()
      }, msUntilMidnight)
    }

    scheduleReset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [saloonId])
}
