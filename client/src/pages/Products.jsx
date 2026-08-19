import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

const PAGE_LIMIT = 10

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function Products() {
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_LIMIT, totalItems: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()
  const canManageProducts = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    let isCancelled = false

    async function fetchProducts() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const params = { page: currentPage, limit: PAGE_LIMIT }
        if (searchQuery) params.search = searchQuery
        if (selectedCategory) params.category = selectedCategory

        const response = await api.get('/products', { params })
        if (isCancelled) return
        setProducts(response.data.data)
        setMeta(response.data.meta)
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error.response?.data?.message || 'Gagal memuat produk')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    fetchProducts()
    return () => {
      isCancelled = true
    }
  }, [currentPage, searchQuery, selectedCategory])

  function handleSearch(event) {
    event.preventDefault()
    setCurrentPage(1)
    setSearchQuery(searchInput)
  }

  function handleCategoryChange(event) {
    setSelectedCategory(event.target.value)
    setCurrentPage(1)
  }

  function goToPage(page) {
    if (page >= 1 && page <= meta.totalPages) {
      setCurrentPage(page)
    }
  }

  const categoryOptions = [...new Set(products.map((product) => product.category))].sort()

  return (
    <main className="bg-grid min-h-screen bg-[#F2F2EE] px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">RAKMAN</h1>
        <Link
          to="/"
          className="border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_black]"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="my-6 border-t border-black" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-4xl">Products</h2>
          <p className="mt-2 font-mono text-sm text-gray-500">{meta.totalItems} product(s) in inventory</p>
        </div>
        {canManageProducts && (
          <Link
            to="/products/add"
            className="border-2 border-black bg-[#FF5C00] px-4 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
          >
            Add product
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="mt-8 flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label htmlFor="search" className="text-xs font-bold uppercase tracking-wider">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or SKU"
            className="w-64 border-2 border-black rounded-none px-3 py-3 shadow-[3px_3px_0px_0px_black] placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-52 border-2 border-black rounded-none bg-white px-3 py-3 shadow-[3px_3px_0px_0px_black]"
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="border-2 border-black bg-[#FF5C00] px-5 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
        >
          Search
        </button>
      </form>

      {errorMessage && (
        <div className="mt-6 border-2 border-black bg-[#FBD5D5] px-3 py-2 font-mono text-sm font-bold">
          SYS_ALERT: {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="mt-8 text-sm">Loading...</p>
      ) : (
        <div className="mt-8 overflow-x-auto border-2 border-black bg-white outline outline-[3px] outline-[#2563EB] outline-offset-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F2F2EE] text-left text-xs font-bold uppercase tracking-wider">
                <th className="border-b-2 border-black px-4 py-3">Name</th>
                <th className="border-b-2 border-black px-4 py-3">SKU</th>
                <th className="border-b-2 border-black px-4 py-3">Category</th>
                <th className="border-b-2 border-black px-4 py-3">Quantity</th>
                <th className="border-b-2 border-black px-4 py-3">Selling Price</th>
                <th className="border-b-2 border-black px-4 py-3">Status</th>
                {canManageProducts && (
                  <th className="border-b-2 border-black px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={canManageProducts ? 7 : 6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.quantity <= product.minStock
                  return (
                    <tr key={product.id} className="border-t border-black first:border-t-0">
                      <td className="px-4 py-3 font-bold">{product.name}</td>
                      <td className="px-4 py-3 font-mono text-sm">{product.sku}</td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3">{product.quantity}</td>
                      <td className="px-4 py-3">{formatPrice(product.sellingPrice)}</td>
                      <td className="px-4 py-3">
                        {isLowStock ? (
                          <span className="inline-block border-2 border-black bg-[#FBD5D5] px-2 py-1 text-xs font-bold uppercase">
                            Low stock
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs font-bold uppercase text-gray-500">
                            In stock
                          </span>
                        )}
                      </td>
                      {canManageProducts && (
                        <td className="px-4 py-3">
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="inline-block border-2 border-black bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_black]"
                          >
                            Edit
                          </Link>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-xs text-gray-500">
          Page {meta.page} of {meta.totalPages || 1} · {meta.totalItems} item(s)
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="border-2 border-black bg-white px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black] disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= meta.totalPages}
            className="border-2 border-black bg-white px-4 py-2 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  )
}

export default Products

