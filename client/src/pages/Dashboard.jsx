import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="bg-grid min-h-screen bg-[#F2F2EE] px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">RAKMAN</h1>
      <div className="border-t border-black my-6" />
      <p className="text-sm">
        Signed in as <span className="font-bold">{user?.email}</span> ({user?.role})
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 bg-[#FF5C00] border-2 border-black px-4 py-2 font-bold uppercase tracking-wide"
      >
        Logout
      </button>
    </main>
  )
}

export default Dashboard