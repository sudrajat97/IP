import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

function ProductForm() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const isEditMode = Boolean(id)
  const canManageProducts = user?.role === 'admin' || user?.role === 'manager'

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    purchasePrice: '',
    sellingPrice: '',
    minStock: '10',
    SupplierId: '',
  })
  const [quantity, setQuantity] = useState(0)
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function loadProductForm() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const requests = [api.get('/suppliers')]
        if (isEditMode) {
          requests.push(api.get(`/products/${id}`))
        }

        const responses = await Promise.all(requests)
        if (isCancelled) return

        setSuppliers(responses[0].data.data)

        if (isEditMode) {
          const product = responses[1].data.data
          setForm({
            name: product.name,
            sku: product.sku,
            category: product.category,
            brand: product.brand || '',
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            minStock: product.minStock,
            SupplierId: product.SupplierId || '',
          })
          setQuantity(product.quantity)
        }
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error.response?.data?.message || 'Failed to load product data')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadProductForm()
    return () => {
      isCancelled = true
    }
  }, [id, isEditMode])

  if (!canManageProducts) {
    return <Navigate to="/products" replace />
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function validateForm() {
    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      return 'Please fill in the required fields (name, SKU, category)'
    }
    const numericValues = [
      Number(form.purchasePrice),
      Number(form.sellingPrice),
      Number(form.minStock),
    ]
    if (numericValues.some((value) => Number.isNaN(value))) {
      return 'Prices and minimum stock must be valid numbers'
    }
    if (numericValues.some((value) => value < 0)) {
      return 'Prices and minimum stock cannot be negative'
    }
    return ''
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      minStock: Number(form.minStock) || 0,
      SupplierId: form.SupplierId ? Number(form.SupplierId) : null,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = buildPayload()
      if (isEditMode) {
        await api.put(`/products/${id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      navigate('/products')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName = 'w-full border-2 border-black rounded-none px-3 py-3 shadow-[3px_3px_0px_0px_black] placeholder:text-gray-400'
  const labelClassName = 'text-xs font-bold uppercase tracking-wider'

  return (
<main className="bg-grid min-h-screen bg-[#F2F2EE] px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">RAKMAN</h1>
        <Link
          to="/products"
          className="border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_black]"
        >
          Back to products
        </Link>
      </header>

      <div className="my-6 border-t border-black" />

      <h2 className="font-bold text-4xl">{isEditMode ? 'Edit product' : 'Add product'}</h2>

      {errorMessage && (
        <div className="mt-6 border-2 border-black bg-[#FBD5D5] px-3 py-2 font-mono text-sm font-bold">
          SYS_ALERT: {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="mt-8 text-sm">Loading...</p>
      ) : (
        <form className="mt-8 max-w-2xl space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className={labelClassName}>
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleFieldChange}
                placeholder="Product name"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sku" className={labelClassName}>
                SKU *
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={form.sku}
                onChange={handleFieldChange}
                placeholder="e.g. SKU-001"
                disabled={isEditMode}
                className={`${inputClassName} disabled:bg-gray-100 disabled:text-gray-500`}
              />
              {isEditMode && (
                <p className="text-xs text-gray-500">SKU cannot be changed after creation.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className={labelClassName}>
                Category *
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleFieldChange}
                placeholder="e.g. Electronics"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="brand" className={labelClassName}>
                Brand
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={form.brand}
                onChange={handleFieldChange}
                placeholder="e.g. Acme"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="purchasePrice" className={labelClassName}>
                Purchase price
              </label>
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                min="0"
                step="1"
                value={form.purchasePrice}
                onChange={handleFieldChange}
                placeholder="0"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sellingPrice" className={labelClassName}>
                Selling price
              </label>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                min="0"
                step="1"
                value={form.sellingPrice}
                onChange={handleFieldChange}
                placeholder="0"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="minStock" className={labelClassName}>
                Minimum stock
              </label>
              <input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                step="1"
                value={form.minStock}
                onChange={handleFieldChange}
                placeholder="10"
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="SupplierId" className={labelClassName}>
                Supplier
              </label>
              <select
                id="SupplierId"
                name="SupplierId"
                value={form.SupplierId}
                onChange={handleFieldChange}
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

            {isEditMode && (
              <div className="space-y-2">
                <span className={labelClassName}>Quantity</span>
                <div className="w-full border-2 border-black bg-gray-100 px-3 py-3">{quantity}</div>
                <p className="text-xs text-gray-500">
                  Stock only changes through purchases and sales.
                </p>
              </div>
            )}
          </div>

          {!isEditMode && (
            <p className="text-xs text-gray-500">
              Stock starts at 0 when the product is created. Stock only changes through purchases
              and sales.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border-2 border-black bg-[#FF5C00] px-6 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Create product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="border-2 border-black bg-white px-6 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </main>
  )
}

export default ProductForm
