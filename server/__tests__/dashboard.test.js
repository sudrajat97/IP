const request = require('supertest')
const app = require('../app')
const { sequelize, User, Product, Sale } = require('../models')
const { signToken } = require('../helpers/jwt')
const { queryInterface } = sequelize

let adminToken, managerToken, staffToken

beforeAll(async () => {
    await queryInterface.bulkDelete('SaleItems', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Sales', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('StockMovements', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Products', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })

    const admin = await User.create({ email: 'admin-dashboard@mail.com', password: '12345', role: 'admin' })
    const manager = await User.create({ email: 'manager-dashboard@mail.com', password: '12345', role: 'manager' })
    const staff = await User.create({ email: 'staff-dashboard@mail.com', password: '12345', role: 'staff' })

    adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role })
    managerToken = signToken({ id: manager.id, email: manager.email, role: manager.role })
    staffToken = signToken({ id: staff.id, email: staff.email, role: staff.role })

    // produk aktif, stok cukup: tidak masuk lowStockCount
    await Product.create({
        name: 'Gula Pasir',
        sku: 'SKU-DASH001',
        category: 'Sembako',
        purchasePrice: 5000,
        sellingPrice: 7000,
        quantity: 20,
        minStock: 10
    })

    // produk aktif, stok menipis: masuk lowStockCount
    await Product.create({
        name: 'Teh Celup',
        sku: 'SKU-DASH002',
        category: 'Minuman',
        purchasePrice: 3000,
        sellingPrice: 4500,
        quantity: 5,
        minStock: 10
    })

    // produk nonaktif: tidak boleh ikut terhitung sama sekali
    await Product.create({
        name: 'Produk Nonaktif',
        sku: 'SKU-DASH003',
        category: 'Sembako',
        purchasePrice: 10000,
        sellingPrice: 15000,
        quantity: 100,
        minStock: 10,
        isActive: false
    })

    // dua sale hari ini
    await Sale.create({ customerName: 'Budi', paymentStatus: 'paid', totalAmount: 50000, UserId: staff.id })
    await Sale.create({ customerName: 'Siti', paymentStatus: 'paid', totalAmount: 30000, UserId: staff.id })

    // sale kemarin, di-backdate manual: tidak boleh ikut todaySales
    const yesterdaySale = await Sale.create({ customerName: 'Kemarin', paymentStatus: 'paid', totalAmount: 999999, UserId: staff.id })
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await queryInterface.bulkUpdate('Sales', { createdAt: yesterday }, { id: yesterdaySale.id })
})

afterAll(async () => {
    await queryInterface.bulkDelete('SaleItems', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Sales', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('StockMovements', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Products', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })
})

describe('GET /api/dashboard/summary', () => {
    test('200 - berhasil ambil ringkasan dashboard dengan angka yang benar (admin)', async () => {
        const response = await request(app)
            .get('/api/dashboard/summary')
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual({
            totalProducts: 2,
            totalCategories: 2,
            lowStockCount: 1,
            todaySalesCount: 2,
            todaySalesAmount: 80000,
            totalInventoryValue: 115000
        })
    })

    test('200 - manager juga bisa akses', async () => {
        const response = await request(app)
            .get('/api/dashboard/summary')
            .set('Authorization', `Bearer ${managerToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('totalProducts', 2)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).get('/api/dashboard/summary')

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh lihat dashboard', async () => {
        const response = await request(app)
            .get('/api/dashboard/summary')
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(403)
    })
})
