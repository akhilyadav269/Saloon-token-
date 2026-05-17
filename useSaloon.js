import { useState, useEffect } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection,
  query, where, getDocs, deleteDoc, addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import dayjs from 'dayjs'
import { todayStr, genSlug, getThreeDaysAgo } from './helpers'

// ── Live Saloon ────────────────────────────────────────────
export const useSaloon = (saloonId) => {
  const [saloon, setSaloon] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!saloonId) { setLoading(false); return }
    const ref = doc(db, 'saloons', saloonId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setSaloon({ id: snap.id, ...snap.data() })
      else setSaloon(null)
      setLoading(false)
    })
    return unsub
  }, [saloonId])

  return { saloon, loading }
}

export const useTokens = (saloonId) => {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!saloonId) return
    const today = todayStr()
    const ref = collection(db, 'saloons', saloonId, 'tokens')
    const q = query(ref, where('date', '==', today))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.tokenNumber - b.tokenNumber)
      setTokens(list)
      setLoading(false)
    })
    return unsub
  }, [saloonId])

  return { tokens, loading }
}

export const bookToken = async (saloonId, { name, phone }) => {
  const today = todayStr()
  const saloonRef = doc(db, 'saloons', saloonId)
  const saloonSnap = await getDoc(saloonRef)
  if (!saloonSnap.exists()) throw new Error('Saloon not found')
  const saloon = saloonSnap.data()
  const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
  const dupQ = query(tokensRef, where('date', '==', today), where('phone', '==', phone), where('status', '!=', 'cancelled'))
  const dupSnap = await getDocs(dupQ)
  if (!dupSnap.empty) throw new Error('You already have a token for today')
  const currentToken = (saloon.currentTokenCounter || 0) + 1
  await updateDoc(saloonRef, { currentTokenCounter: currentToken })
  const waitingQ = query(tokensRef, where('date', '==', today), where('status', '==', 'waiting'))
  const waitingSnap = await getDocs(waitingQ)
  const position = waitingSnap.size
  const tokenDoc = {
    name, phone, tokenNumber: currentToken, status: 'waiting',
    date: today, position, createdAt: serverTimestamp(), notified: false,
  }
  const ref = await addDoc(tokensRef, tokenDoc)
  return { id: ref.id, tokenNumber: currentToken, position }
}

export const markPresent = async (saloonId, tokenId) =>
  updateDoc(doc(db, 'saloons', saloonId, 'tokens', tokenId), { status: 'present' })

export const skipToken = async (saloonId, tokenId) => {
  await updateDoc(doc(db, 'saloons', saloonId, 'tokens', tokenId), { status: 'skipped', skippedAt: serverTimestamp() })
  await recalcPositions(saloonId)
}

export const cancelToken = async (saloonId, tokenId) => {
  await updateDoc(doc(db, 'saloons', saloonId, 'tokens', tokenId), { status: 'cancelled' })
  await recalcPositions(saloonId)
}

export const nextToken = async (saloonId, currentTokenId) => {
  if (currentTokenId)
    await updateDoc(doc(db, 'saloons', saloonId, 'tokens', currentTokenId), { status: 'completed' })
  await recalcPositions(saloonId)
}

export const runLateToken = async (saloonId, tokenId) => {
  const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
  const q = query(tokensRef, where('date', '==', todayStr()), where('status', '==', 'waiting'))
  const snap = await getDocs(q)
  const maxPos = snap.docs.reduce((max, d) => Math.max(max, d.data().position ?? 0), -1)
  await updateDoc(doc(db, 'saloons', saloonId, 'tokens', tokenId), { position: maxPos + 1 })
  await recalcPositions(saloonId)
}

const recalcPositions = async (saloonId) => {
  const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
  const q = query(tokensRef, where('date', '==', todayStr()), where('status', '==', 'waiting'))
  const snap = await getDocs(q)
  const sorted = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.position ?? a.tokenNumber) - (b.position ?? b.tokenNumber))
  await Promise.all(sorted.map((t, i) =>
    updateDoc(doc(db, 'saloons', saloonId, 'tokens', t.id), { position: i })
  ))
}

export const getReports = async (saloonId) => {
  const reports = {}
  for (let i = 0; i < 3; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
    const q = query(tokensRef, where('date', '==', date))
    const snap = await getDocs(q)
    const tokens = snap.docs.map(d => d.data())
    reports[date] = {
      total: tokens.length,
      completed: tokens.filter(t => t.status === 'completed').length,
      cancelled: tokens.filter(t => t.status === 'cancelled').length,
      skipped: tokens.filter(t => t.status === 'skipped').length,
      waiting: tokens.filter(t => t.status === 'waiting' || t.status === 'present').length,
    }
  }
  return reports
}

export const getAllSaloons = async () => {
  const snap = await getDocs(collection(db, 'saloons'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createSaloon = async (data) => {
  const id = genSlug(data.name) + '-' + Math.random().toString(36).substr(2, 4)
  await setDoc(doc(db, 'saloons', id), {
    ...data, id, currentTokenCounter: 0, workers: 1, holidays: [],
    services: ['Haircut', 'Beard Trim', 'Shave'],
    colorTheme: '#d4af37', perPersonTime: 20,
    openTime: '09:00', closeTime: '21:00', createdAt: serverTimestamp(),
  })
  return id
}

export const updateSaloon = async (saloonId, data) =>
  updateDoc(doc(db, 'saloons', saloonId), data)

export const deleteSaloon = async (saloonId) => {
  const tokensRef = collection(db, 'saloons', saloonId, 'tokens')
  const snap = await getDocs(tokensRef)
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'saloons', saloonId))
}
