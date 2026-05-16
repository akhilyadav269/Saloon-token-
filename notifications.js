export const requestPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export const sendNotification = (title, body, options = {}) => {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  })
  setTimeout(() => n.close(), 8000)
  return n
}

export const scheduleNotification = (title, body, delayMs) => {
  return setTimeout(() => sendNotification(title, body), delayMs)
}
