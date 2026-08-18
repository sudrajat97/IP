const { sequelize, Product, Supplier } = require('../models')
const { queryInterface } = sequelize

afterAll(async () => {
    await queryInterface.bulkDelete('Products', null, {
        truncate: true,
        cascade: true,
        restartIdentity: true
    })
    await queryInterface.bulkDelete('Suppliers', null, {
        truncate: true,
        cascade: true,
        restartIdentity: true
    })
})

describe('Supplier model', () => {
    test('berhasil membuat supplier baru', async () => {
        const supplier = await Supplier.create({
            companyName: "PT Sumber Makmur",
            contactPerson: "Andi",
            phone: "08123456789",
            email: "andi@sumbermakmur.com",
            address: "Jl. Merdeka No. 1"
        })

        expect(supplier.id).toEqual(expect.any(Number))
        expect(supplier.companyName).toBe("PT Sumber Makmur")
    })
})

describe('Product model', () => {
    test('berhasil membuat product baru dengan default value yang benar', async () => {
        const product = await Product.create({
            name: "Kopi Arabika",
            sku: "SKU-001",
            category: "Minuman",
            purchasePrice: 20000,
            sellingPrice: 30000
        })

        expect(product.id).toEqual(expect.any(Number))
        expect(product.quantity).toBe(0)
        expect(product.minStock).toBe(10)
        expect(product.isActive).toBe(true)
    })

    test('product bisa dibuat tanpa SupplierId karena nullable', async () => {
        const product = await Product.create({
            name: "Beras Premium",
            sku: "SKU-002",
            category: "Sembako",
            purchasePrice: 12000,
            sellingPrice: 15000
        })

        expect(product.SupplierId).toBeNull()
    })

    test('gagal membuat product tanpa name', async () => {
        await expect(Product.create({
            sku: "SKU-003",
            category: "Minuman",
            purchasePrice: 20000,
            sellingPrice: 30000
        })).rejects.toThrow()
    })

    test('gagal membuat product dengan sku duplikat', async () => {
        await Product.create({
            name: "Teh Hijau",
            sku: "SKU-004",
            category: "Minuman",
            purchasePrice: 10000,
            sellingPrice: 15000
        })

        await expect(Product.create({
            name: "Teh Hijau 2",
            sku: "SKU-004",
            category: "Minuman",
            purchasePrice: 10000,
            sellingPrice: 15000
        })).rejects.toThrow()
    })

    test('gagal membuat product dengan purchasePrice negatif', async () => {
        await expect(Product.create({
            name: "Produk Rugi",
            sku: "SKU-005",
            category: "Minuman",
            purchasePrice: -1000,
            sellingPrice: 15000
        })).rejects.toThrow()
    })

    test('sku tidak berubah walau di-update', async () => {
        const product = await Product.create({
            name: "Gula Pasir",
            sku: "SKU-006",
            category: "Sembako",
            purchasePrice: 12000,
            sellingPrice: 15000
        })

        await product.update({ sku: "SKU-999" })
        await product.reload()

        expect(product.sku).toBe("SKU-006")
    })
})
