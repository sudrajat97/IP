import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

const SEARCH_LIMIT = 20

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function PurchaseNew() {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [cartQuantities, setCartQuantities] = useState({})
  const [cart, setCart] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const canRecordPurchase = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    let isCancelled = false

    async function loadSuppliers() {
      try {
        const response = await api.get('/suppliers')
        if (isCancelled) return
        setSuppliers(response.data.data)
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error.response?.data?.message || 'Failed to load suppliers')
      }
    }

    loadSuppliers()
    return () => {
      isCancelled = true
    }
  }, [])

  if (!canRecordPurchase) {
    return <Navigate to="/" replace />
  }

  async function handleSearch(event) {
    event.preventDefault()
    setIsSearching(true)
    setErrorMessage('')
    try {
      const response = await api.get('/products', {
        params: { search: searchInput, limit: SEARCH_LIMIT },
      })
      setSearchResults(response.data.data)
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load products')
    } finally {
      setIsSearching(false)
    }
  }

  function handleAdd(product) {
    const requestedQty = Math.max(1, Math.floor(Number(cartQuantities[product.id]) || 1))

    setSuccessMessage('')
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.ProductId === product.id)
      if (existing) {
        // Incoming stock is not limited by current stock, so quantities simply add up.
        return currentCart.map((item) =>
          item.ProductId === product.id
            ? { ...item, quantity: item.quantity + requestedQty }
            : item
        )
      }
      return [
        ...currentCart,
        {
          ProductId: product.id,
          name: product.name,
          purchasePrice: product.purchasePrice,
          currentStock: product.quantity,
          quantity: requestedQty,
        },
      ]
    })
    setCartQuantities((current) => ({ ...current, [product.id]: 1 }))
  }

  function handleCartQuantityChange(ProductId, value) {
    const parsed = Number(value)
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.ProductId !== ProductId) return item
        if (Number.isNaN(parsed) || parsed < 1) return { ...item, quantity: 1 }
        return { ...item, quantity: Math.floor(parsed) }
      })
    )
  }

  function handleRemoveItem(ProductId) {
    setCart((currentCart) => currentCart.filter((item) => item.ProductId !== ProductId))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the cart')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/purchases', {
        SupplierId: supplierId ? Number(supplierId) : null,
        items: cart.map((item) => ({ ProductId: item.ProductId, quantity: item.quantity })),
      })
      setCart([])
      setCartQuantities({})
      setSearchResults([])
      setSuccessMessage('Purchase recorded successfully')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to record purchase')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0)

  const inputClassName = 'w-full border-2 border-black rounded-none px-3 py-3 shadow-[3px_3px_0px_0px_black] placeholder:text-gray-400'
  const labelClassName = 'text-xs font-bold uppercase tracking-wider'

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

      <h2 className="font-bold text-4xl">New purchase</h2>

      {errorMessage && (
        <div className="mt-6 border-2 border-black bg-[#FBD5D5] px-3 py-2 font-mono text-sm font-bold">
          SYS_ALERT: {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 border-2 border-black bg-[#DCFCE7] px-3 py-2 font-mono text-sm font-bold">
          PURCHASE_OK: {successMessage}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="bg-white border-2 border-black outline outline-[3px] outline-[#2563EB] outline-offset-6 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider">Purchase details</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="supplierId" className={labelClassName}>
                  Supplier (optional)
                </label>
                <select
                  id="supplierId"
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className={`${inputClassName} bg-white`}
                >
                  <option value="">No supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black outline outline-[3px] outline-[#2563EB] outline-offset-6 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider">Add products</h3>

            <form className="mt-4 flex items-end gap-3" onSubmit={handleSearch}>
              <div className="flex-1 space-y-2">
                <label htmlFor="productSearch" className={labelClassName}>
                  Search product
                </label>
                <input
                  id="productSearch"
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name or SKU"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                className="border-2 border-black bg-[#FF5C00] px-4 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
              >
                Search
              </button>
            </form>

            {isSearching ? (
              <p className="mt-4 text-sm">Searching...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No products found. Try a different search.
                  </p>
                ) : (
                  searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 border-t border-black pt-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">{product.name}</p>
                        <p className="font-mono text-xs text-gray-500">
                          {formatPrice(product.purchasePrice)} · {product.quantity} in stock
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={cartQuantities[product.id] || 1}
                          onChange={(event) =>
                            setCartQuantities((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          className="w-16 border-2 border-black rounded-none px-2 py-2 text-center shadow-[3px_3px_0px_0px_black]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className="border-2 border-black bg-[#FF5C00] px-3 py-2 text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-black outline outline-[3px] outline-[#2563EB] outline-offset-6 p-6 self-start"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider">Cart</h3>

          <div className="mt-4 divide-y divide-black">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Cart is empty. Search and add products.</p>
            ) : (
              cart.map((item) => (
                <div key={item.ProductId} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{item.name}</p>
                      <p className="font-mono text-xs text-gray-500">
                        {formatPrice(item.purchasePrice)} each · {item.currentStock} in stock
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          handleCartQuantityChange(item.ProductId, event.target.value)
                        }
                        className="w-16 border-2 border-black rounded-none px-2 py-2 text-center shadow-[3px_3px_0px_0px_black]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.ProductId)}
                        className="border-2 border-black bg-white px-2 py-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_black]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Subtotal</span>
                    <span className="font-bold">
                      {formatPrice(item.purchasePrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t-2 border-black pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold">{formatPrice(totalAmount)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Prices are a client-side preview. Incoming quantity is not limited by current stock.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="mt-4 w-full border-2 border-black bg-[#FF5C00] px-4 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black] disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record purchase'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default PurchaseNew



