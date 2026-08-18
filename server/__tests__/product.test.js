const request = require('supertest')
const app = require('../app')
const { sequelize, User, Product } = require('../models')
const { signToken } = require('../helpers/jwt')
const { queryInterface } = sequelize

let adminToken, managerToken, staffToken
let activeProduct, inactiveProduct

beforeAll(async () => {
    const admin = await User.create({ email: 'admin-product@mail.com', password: '12345', role: 'admin' })
    const manager = await User.create({ email: 'manager-product@mail.com', password: '12345', role: 'manager' })
    const staff = await User.create({ email: 'staff-product@mail.com', password: '12345', role: 'staff' })

    adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role })
    managerToken = signToken({ id: manager.id, email: manager.email, role: manager.role })
    staffToken = signToken({ id: staff.id, email: staff.email, role: staff.role })

    activeProduct = await Product.create({
        name: 'Kopi Arabika',
        sku: 'SKU-P001',
        category: 'Minuman',
        purchasePrice: 20000,
        sellingPrice: 30000,
        quantity: 5,
        minStock: 10
    })

    inactiveProduct = await Product.create({
        name: 'Produk Nonaktif',
        sku: 'SKU-P002',
        category: 'Minuman',
        purchasePrice: 10000,
        sellingPrice: 15000,
        isActive: false
    })
})

afterAll(async () => {
    await queryInterface.bulkDelete('Products', null, {
        truncate: true,
        cascade: true,
        restartIdentity: true
    })
    await queryInterface.bulkDelete('Users', null, {
        truncate: true,
        cascade: true,
        restartIdentity: true
    })
})

describe('GET /api/products', () => {
    test('200 - berhasil ambil list product beserta meta pagination', async () => {
        const response = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data', expect.any(Array))
        expect(response.body).toHaveProperty('meta')
        expect(response.body.meta).toHaveProperty('page', 1)
        expect(response.body.meta).toHaveProperty('limit', 10)
        expect(response.body.meta).toHaveProperty('totalItems', expect.any(Number))
        expect(response.body.meta).toHaveProperty('totalPages', expect.any(Number))
    })

    test('200 - default hanya menampilkan product dengan isActive true', async () => {
        const response = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${staffToken}`)

        const skuList = response.body.data.map((product) => product.sku)
        expect(skuList).toContain('SKU-P001')
        expect(skuList).not.toContain('SKU-P002')
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).get('/api/products')

        expect(response.status).toBe(401)
    })
})

describe('GET /api/products/:id', () => {
    test('200 - berhasil ambil detail product aktif', async () => {
        const response = await request(app)
            .get(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('sku', 'SKU-P001')
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).get(`/api/products/${activeProduct.id}`)

        expect(response.status).toBe(401)
    })

    test('200 - admin tetap bisa akses product yang isActive false', async () => {
        const response = await request(app)
            .get(`/api/products/${inactiveProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('sku', 'SKU-P002')
    })

    test('200 - manager tetap bisa akses product yang isActive false', async () => {
        const response = await request(app)
            .get(`/api/products/${inactiveProduct.id}`)
            .set('Authorization', `Bearer ${managerToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('sku', 'SKU-P002')
    })

    test('404 - staff tidak bisa akses product yang isActive false', async () => {
        const response = await request(app)
            .get(`/api/products/${inactiveProduct.id}`)
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(404)
    })
})

describe('POST /api/products', () => {
    test('201 - berhasil membuat product baru (manager)', async () => {
        const response = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
                name: 'Teh Hijau',
                sku: 'SKU-P003',
                category: 'Minuman',
                purchasePrice: 8000,
                sellingPrice: 12000
            })

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('sku', 'SKU-P003')
    })

    test('400 - gagal karena name tidak diisi', async () => {
        const response = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                sku: 'SKU-P004',
                category: 'Minuman',
                purchasePrice: 8000,
                sellingPrice: 12000
            })

        expect(response.status).toBe(400)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .post('/api/products')
            .send({
                name: 'Produk Tanpa Token',
                sku: 'SKU-P005',
                category: 'Minuman',
                purchasePrice: 8000,
                sellingPrice: 12000
            })

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh membuat product', async () => {
        const response = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                name: 'Produk Staff',
                sku: 'SKU-P006',
                category: 'Minuman',
                purchasePrice: 8000,
                sellingPrice: 12000
            })

        expect(response.status).toBe(403)
    })
})

describe('PUT /api/products/:id', () => {
    test('200 - berhasil update product (admin)', async () => {
        const response = await request(app)
            .put(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ sellingPrice: 35000 })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('sellingPrice', 35000)
    })

    test('400 - gagal karena sellingPrice negatif', async () => {
        const response = await request(app)
            .put(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ sellingPrice: -1000 })

        expect(response.status).toBe(400)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .put(`/api/products/${activeProduct.id}`)
            .send({ sellingPrice: 35000 })

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh update product', async () => {
        const response = await request(app)
            .put(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ sellingPrice: 35000 })

        expect(response.status).toBe(403)
    })

    test('sku tidak berubah walau dikirim di body', async () => {
        const response = await request(app)
            .put(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ sku: 'SKU-BARU' })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('sku', 'SKU-P001')
    })
})

describe('DELETE /api/products/:id', () => {
    test('200 - berhasil soft delete product (admin)', async () => {
        const response = await request(app)
            .delete(`/api/products/${activeProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('isActive', false)

        await activeProduct.reload()
        expect(activeProduct.isActive).toBe(false)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).delete(`/api/products/${inactiveProduct.id}`)

        expect(response.status).toBe(401)
    })

    test('403 - role manager tidak boleh delete product', async () => {
        const response = await request(app)
            .delete(`/api/products/${inactiveProduct.id}`)
            .set('Authorization', `Bearer ${managerToken}`)

        expect(response.status).toBe(403)
    })
})
