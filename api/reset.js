import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      })
    }

    const db = getFirestore()
    const saloonsSnap = await db.collection('saloons').get()
    
    await Promise.all(saloonsSnap.docs.map(doc => 
      doc.ref.update({ currentTokenCounter: 0 })
    ))

    res.json({ success: true, reset: saloonsSnap.size })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
