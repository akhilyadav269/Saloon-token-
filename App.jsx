import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './AuthContext'
import Home from './Home'
import SuperAdmin from './SuperAdmin'
import OwnerDashboard from './OwnerDashboard'
import BookingPage from './BookingPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<SuperAdmin />} />
          <Route path="/saloon/:saloonId" element={<BookingPage />} />
          <Route path="/saloon/:saloonId/owner" element={<OwnerDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#141414',
            color: '#fff',
            border: '1px solid #333',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#d4af37', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </AuthProvider>
  )
}
