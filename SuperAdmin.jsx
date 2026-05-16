import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllSaloons, createSaloon, updateSaloon, deleteSaloon } from '../hooks/useSaloon'
import toast from 'react-hot-toast'

const THEMES = ['#d4af37','#e74c3c','#2ecc71','#3498db','#9b59b6','#e67e22','#1abc9c','#e91e63']

export default function SuperAdmin() {
  const { superAdminLoggedIn, loginSuperAdmin, logoutSuperAdmin } = useAuth()
  const [password, setPassword] = useState('')
  const [saloons, setSaloons] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editSaloon, setEditSaloon] = useState(null)
  const [form, setForm] = useState({
    name: '', ownerEmail: '', ownerPassword: '', ownerPhone: '',
    openTime: '09:00', closeTime: '21:00', colorTheme: '#d4af37', perPersonTime: 20
  })

  const handleLogin = (e) => {
    e.preventDefault()
    if (!loginSuperAdmin(password)) toast.error('Wrong password')
    else toast.success('Welcome, Super Admin!')
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllSaloons()
      setSaloons(data)
    } catch (err) {
      toast.error('Failed to load saloons')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (superAdminLoggedIn) load()
  }, [superAdminLoggedIn])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const id = await createSaloon(form)
      toast.success(`Saloon created! Link: /saloon/${id}`)
      setShowCreate(false)
      setForm({ name: '', ownerEmail: '', ownerPassword: '', ownerPhone: '', openTime: '09:00', closeTime: '21:00', colorTheme: '#d4af37', perPersonTime: 20 })
      load()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateSaloon(editSaloon.id, form)
      toast.success('Saloon updated!')
      setEditSaloon(null)
      load()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this saloon permanently?')) return
    try {
      await deleteSaloon(id)
      toast.success('Saloon deleted')
      load()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const openEdit = (s) => {
    setForm({ name: s.name, ownerEmail: s.ownerEmail, ownerPassword: s.ownerPassword, ownerPhone: s.ownerPhone, openTime: s.openTime, closeTime: s.closeTime, colorTheme: s.colorTheme, perPersonTime: s.perPersonTime })
    setEditSaloon(s)
  }

  if (!superAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-8 w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👑</div>
            <h1 className="font-display text-3xl text-gold-400">Super Admin</h1>
            <p className="text-dark-400 text-sm mt-1 font-body">Restricted Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter super admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-gold-500 transition-colors"
              required
            />
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-body font-semibold py-3 rounded-xl transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-gold-400">👑 Super Admin Panel</h1>
            <p className="text-dark-400 font-body text-sm mt-1">Manage all saloon owners</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="bg-gold-500 hover:bg-gold-400 text-dark-900 font-body font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              + Add Saloon
            </button>
            <button
              onClick={logoutSuperAdmin}
              className="bg-dark-700 hover:bg-dark-600 text-dark-300 font-body px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Saloons Grid */}
        {loading ? (
          <div className="text-center py-20 text-dark-400 font-body">Loading...</div>
        ) : saloons.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💈</div>
            <p className="text-dark-400 font-body">No saloons yet. Add the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saloons.map(s => (
              <div key={s.id} className="bg-dark-800 border border-dark-600 rounded-2xl p-5 hover:border-gold-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.colorTheme || '#d4af37' }} />
                    <h3 className="font-display text-lg text-white">{s.name}</h3>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm font-body text-dark-300 mb-4">
                  <div>📧 {s.ownerEmail}</div>
                  <div>📞 {s.ownerPhone}</div>
                  <div>🕐 {s.openTime} – {s.closeTime}</div>
                  <div>⏱ {s.perPersonTime} min/person</div>
                </div>
                <div className="bg-dark-700 rounded-lg px-3 py-2 mb-4 text-xs text-dark-400 font-mono break-all">
                  /saloon/{s.id}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-body text-sm py-2 rounded-lg transition-colors">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-body text-sm py-2 rounded-lg transition-colors">
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreate || editSaloon) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <h2 className="font-display text-2xl text-gold-400 mb-6">
              {editSaloon ? '✏️ Edit Saloon' : '+ New Saloon'}
            </h2>
            <form onSubmit={editSaloon ? handleUpdate : handleCreate} className="space-y-4">
              <Field label="Saloon Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Field label="Owner Email" type="email" value={form.ownerEmail} onChange={v => setForm(f => ({ ...f, ownerEmail: v }))} required />
              <Field label="Owner Password" type="password" value={form.ownerPassword} onChange={v => setForm(f => ({ ...f, ownerPassword: v }))} required />
              <Field label="Owner Phone" value={form.ownerPhone} onChange={v => setForm(f => ({ ...f, ownerPhone: v }))} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Open Time" type="time" value={form.openTime} onChange={v => setForm(f => ({ ...f, openTime: v }))} required />
                <Field label="Close Time" type="time" value={form.closeTime} onChange={v => setForm(f => ({ ...f, closeTime: v }))} required />
              </div>
              <Field label="Per Person Time (min)" type="number" value={form.perPersonTime} onChange={v => setForm(f => ({ ...f, perPersonTime: parseInt(v) }))} required />
              <div>
                <label className="block text-dark-300 font-body text-sm mb-2">Color Theme</label>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, colorTheme: c }))}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: form.colorTheme === c ? '3px solid white' : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-gold-500 hover:bg-gold-400 text-dark-900 font-body font-semibold py-3 rounded-xl transition-colors">
                  {editSaloon ? 'Update' : 'Create Saloon'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setEditSaloon(null) }}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-dark-300 font-body py-3 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const Field = ({ label, type = 'text', value, onChange, required }) => (
  <div>
    <label className="block text-dark-300 font-body text-sm mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-white font-body focus:outline-none focus:border-gold-500 transition-colors text-sm"
    />
  </div>
)
