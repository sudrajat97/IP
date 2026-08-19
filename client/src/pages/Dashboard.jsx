import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const canRecordPurchase = user?.role === 'admin' || user?.role === 'manager'

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
      <div className="mt-6 flex gap-3">
        <Link
          to="/sales/new"
          className="bg-[#FF5C00] border-2 border-black px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
        >
          New sale
        </Link>
        <Link
          to="/products"
          className="bg-white border-2 border-black px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
        >
          Products
        </Link>
        {canRecordPurchase && (
          <Link
            to="/purchases/new"
            className="bg-white border-2 border-black px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
          >
            New purchase
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="bg-white border-2 border-black px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
        >
          Logout
        </button>
      </div>
    </main>
  )
}

export default Dashboard