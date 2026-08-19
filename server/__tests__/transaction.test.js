const request = require('supertest')
const app = require('../app')
const { sequelize, User, Product, Sale, SaleItem, StockMovement } = require('../models')
const { signToken } = require('../helpers/jwt')
const { queryInterface } = sequelize

let adminToken, managerToken, staffToken
let productA, productB, productLowStock

beforeAll(async () => {
    const admin = await User.create({ email: 'admin-tx@mail.com', password: '12345', role: 'admin' })
    const manager = await User.create({ email: 'manager-tx@mail.com', password: '12345', role: 'manager' })
    const staff = await User.create({ email: 'staff-tx@mail.com', password: '12345', role: 'staff' })

    adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role })
    managerToken = signToken({ id: manager.id, email: manager.email, role: manager.role })
    staffToken = signToken({ id: staff.id, email: staff.email, role: staff.role })

    productA = await Product.create({
        name: 'Gula Pasir',
        sku: 'SKU-TX001',
        category: 'Sembako',
        purchasePrice: 10000,
        sellingPrice: 15000,
        quantity: 20,
        minStock: 10
    })

    productB = await Product.create({
        name: 'Minyak Goreng',
        sku: 'SKU-TX002',
        category: 'Sembako',
        purchasePrice: 20000,
        sellingPrice: 28000,
        quantity: 20,
        minStock: 10
    })

    productLowStock = await Product.create({
        name: 'Beras Premium',
        sku: 'SKU-TX003',
        category: 'Sembako',
        purchasePrice: 12000,
        sellingPrice: 18000,
        quantity: 3,
        minStock: 10
    })
})

afterAll(async () => {
    await queryInterface.bulkDelete('SaleItems', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Sales', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('StockMovements', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Products', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })
})

describe('POST /api/purchases', () => {
    test('201 - berhasil catat purchase, stok bertambah dan StockMovement tercatat', async () => {
        const response = await request(app)
            .post('/api/purchases')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                SupplierId: 1,
                items: [{ ProductId: productA.id, quantity: 5 }]
            })

        expect(response.status).toBe(201)

        await productA.reload()
        expect(productA.quantity).toBe(25)

        const movement = await StockMovement.findOne({
            where: { ProductId: productA.id, type: 'purchase' }
        })
        expect(movement).not.toBeNull()
        expect(movement.quantityBefore).toBe(20)
        expect(movement.quantityAfter).toBe(25)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .post('/api/purchases')
            .send({ items: [{ ProductId: productA.id, quantity: 5 }] })

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh catat purchase', async () => {
        const response = await request(app)
            .post('/api/purchases')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ items: [{ ProductId: productA.id, quantity: 5 }] })

        expect(response.status).toBe(403)
    })
})

describe('POST /api/sales', () => {
    test('201 - berhasil catat sale, stok berkurang, totalAmount dihitung server', async () => {
        const response = await request(app)
            .post('/api/sales')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                customerName: 'Budi',
                paymentStatus: 'paid',
                items: [{ ProductId: productB.id, quantity: 2, priceAtSale: 1 }]
            })

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('totalAmount', 56000)

        await productB.reload()
        expect(productB.quantity).toBe(18)

        const saleItem = await SaleItem.findOne({ where: { ProductId: productB.id } })
        expect(saleItem.priceAtSale).toBe(28000)
    })

    test('400 - stok tidak mencukupi, seluruh transaksi rollback', async () => {
        const quantityBeforeRequest = productA.quantity

        const response = await request(app)
            .post('/api/sales')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                customerName: 'Siti',
                paymentStatus: 'paid',
                items: [
                    { ProductId: productA.id, quantity: 1 },
                    { ProductId: productLowStock.id, quantity: 999 }
                ]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('message', 'Stok tidak mencukupi')

        await productA.reload()
        expect(productA.quantity).toBe(quantityBeforeRequest)

        const saleCount = await Sale.count({ where: { customerName: 'Siti' } })
        expect(saleCount).toBe(0)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .post('/api/sales')
            .send({
                customerName: 'Tanpa Token',
                paymentStatus: 'paid',
                items: [{ ProductId: productA.id, quantity: 1 }]
            })

        expect(response.status).toBe(401)
    })
})
