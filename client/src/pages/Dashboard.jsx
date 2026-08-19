import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const canRecordPurchase = user?.role === 'admin' || user?.role === 'manager'
  const canViewSummary = user?.role === 'admin' || user?.role === 'manager'

  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!canViewSummary) return

    let isCancelled = false

    async function fetchSummary() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await api.get('/dashboard/summary')
        if (isCancelled) return
        setSummary(response.data.data)
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error.response?.data?.message || 'Failed to load dashboard summary')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    fetchSummary()
    return () => {
      isCancelled = true
    }
  }, [canViewSummary])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="bg-grid min-h-screen bg-[#F2F2EE] px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">RAKMAN</h1>
      </header>

      <div className="my-6 border-t border-black" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-bold text-4xl">Dashboard</h2>
        <p className="text-sm">
          Signed in as <span className="font-bold">{user?.email}</span> ({user?.role})
        </p>
      </div>

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

      {errorMessage && (
        <div className="mt-6 border-2 border-black bg-[#FBD5D5] px-3 py-2 font-mono text-sm font-bold">
          SYS_ALERT: {errorMessage}
        </div>
      )}

      {!canViewSummary && (
        <div className="mt-8 border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
          <p className="text-xs font-bold uppercase tracking-wider">Dashboard summary</p>
          <p className="mt-3 text-sm text-gray-500">
            Dashboard summary is only available to admin and manager roles.
          </p>
        </div>
      )}

      {canViewSummary && isLoading && (
        <p className="mt-8 text-sm">Loading summary...</p>
      )}

      {canViewSummary && !isLoading && summary && (
        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
            <p className="text-xs font-bold uppercase tracking-wider">Total products</p>
            <p className="mt-3 text-3xl font-bold">{summary.totalProducts}</p>
          </div>

          <div className="border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
            <p className="text-xs font-bold uppercase tracking-wider">Categories</p>
            <p className="mt-3 text-3xl font-bold">{summary.totalCategories}</p>
          </div>

          <Link
            to="/products"
            className={`border-2 border-black p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6 ${
              summary.lowStockCount > 0 ? 'bg-[#FBD5D5]' : 'bg-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">Low stock</p>
            <p className="mt-3 text-3xl font-bold">{summary.lowStockCount}</p>
            {summary.lowStockCount > 0 && (
              <span className="mt-3 inline-block border-2 border-black bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                Check products &gt;
              </span>
            )}
          </Link>

          <div className="border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
            <p className="text-xs font-bold uppercase tracking-wider">Today's sales count</p>
            <p className="mt-3 text-3xl font-bold">{summary.todaySalesCount}</p>
          </div>

          <div className="border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
            <p className="text-xs font-bold uppercase tracking-wider">Today's sales amount</p>
            <p className="mt-3 text-3xl font-bold">{formatPrice(summary.todaySalesAmount)}</p>
          </div>

          <div className="border-2 border-black bg-white p-6 outline outline-[3px] outline-[#2563EB] outline-offset-6">
            <p className="text-xs font-bold uppercase tracking-wider">Inventory value</p>
            <p className="mt-3 text-3xl font-bold">{formatPrice(summary.totalInventoryValue)}</p>
          </div>
        </section>
      )}
    </main>
  )
}

export default Dashboard