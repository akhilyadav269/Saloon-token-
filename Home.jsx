import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-slide-up">
        <div className="text-7xl mb-6">💈</div>
        <h1 className="font-display text-4xl text-gold-400 mb-3">Saloon Token System</h1>
        <p className="text-dark-400 font-body mb-10">Digital queue management for modern saloons</p>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gold-500 hover:bg-gold-400 text-dark-900 font-body font-semibold px-8 py-3.5 rounded-xl transition-colors w-full mb-3">
          Super Admin Panel
        </button>
        <p className="text-dark-500 font-body text-sm">
          Saloon owners: visit your unique link<br/>
          <span className="text-dark-400 font-mono">/saloon/[your-saloon-id]/owner</span>
        </p>
      </div>
    </div>
  )
}
