import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [superAdminLoggedIn, setSuperAdminLoggedIn] = useState(false)
  const [ownerSession, setOwnerSession] = useState(null) // { saloonId, email }

  useEffect(() => {
    // Restore 30-day sessions
    const sa = sessionStorage.getItem('superAdmin')
    if (sa) setSuperAdminLoggedIn(true)

    const ownerRaw = localStorage.getItem('ownerSession')
    if (ownerRaw) {
      const { data, expiry } = JSON.parse(ownerRaw)
      if (Date.now() < expiry) setOwnerSession(data)
      else localStorage.removeItem('ownerSession')
    }
  }, [])

  const loginSuperAdmin = (pwd) => {
    // Check against Firestore in real app; hardcoded for bootstrap
    if (pwd === import.meta.env.VITE_SUPER_ADMIN_PASSWORD || pwd === 'superadmin123') {
      sessionStorage.setItem('superAdmin', '1')
      setSuperAdminLoggedIn(true)
      return true
    }
    return false
  }

  const logoutSuperAdmin = () => {
    sessionStorage.removeItem('superAdmin')
    setSuperAdminLoggedIn(false)
  }

  const loginOwner = (saloonId, email) => {
    const data = { saloonId, email }
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    localStorage.setItem('ownerSession', JSON.stringify({ data, expiry }))
    setOwnerSession(data)
  }

  const logoutOwner = () => {
    localStorage.removeItem('ownerSession')
    setOwnerSession(null)
  }

  return (
    <AuthContext.Provider value={{
      superAdminLoggedIn, loginSuperAdmin, logoutSuperAdmin,
      ownerSession, loginOwner, logoutOwner,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
