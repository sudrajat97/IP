const request = require('supertest')
const app = require('../app')
const { sequelize, User, Product, Supplier } = require('../models')
const { signToken } = require('../helpers/jwt')
const { queryInterface } = sequelize

let adminToken, managerToken, staffToken
let supplierWithProduct, supplierWithInactiveProduct, supplierEmpty

beforeAll(async () => {
    const admin = await User.create({ email: 'admin-supplier@mail.com', password: '12345', role: 'admin' })
    const manager = await User.create({ email: 'manager-supplier@mail.com', password: '12345', role: 'manager' })
    const staff = await User.create({ email: 'staff-supplier@mail.com', password: '12345', role: 'staff' })

    adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role })
    managerToken = signToken({ id: manager.id, email: manager.email, role: manager.role })
    staffToken = signToken({ id: staff.id, email: staff.email, role: staff.role })

    supplierWithProduct = await Supplier.create({
        companyName: 'PT Sumber Makmur',
        contactPerson: 'Andi',
        phone: '08123456789',
        email: 'andi@sumbermakmur.com',
        address: 'Jakarta'
    })

    supplierWithInactiveProduct = await Supplier.create({
        companyName: 'PT Rejeki Abadi',
        contactPerson: 'Budi',
        phone: '08129876543',
        email: 'budi@rejekiabadi.com',
        address: 'Surabaya'
    })

    supplierEmpty = await Supplier.create({
        companyName: 'PT Tanpa Produk',
        contactPerson: 'Citra',
        phone: '08120001111',
        email: 'citra@tanpaproduk.com',
        address: 'Bandung'
    })

    await Product.create({
        name: 'Kopi Robusta',
        sku: 'SKU-SUP001',
        category: 'Minuman',
        purchasePrice: 15000,
        sellingPrice: 22000,
        quantity: 10,
        SupplierId: supplierWithProduct.id
    })

    await Product.create({
        name: 'Produk Nonaktif Supplier',
        sku: 'SKU-SUP002',
        category: 'Minuman',
        purchasePrice: 10000,
        sellingPrice: 15000,
        quantity: 0,
        isActive: false,
        SupplierId: supplierWithInactiveProduct.id
    })
})

afterAll(async () => {
    await queryInterface.bulkDelete('Products', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Suppliers', null, { truncate: true, cascade: true, restartIdentity: true })
    await queryInterface.bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })
})

describe('GET /api/suppliers', () => {
    test('200 - berhasil ambil list supplier tanpa pagination', async () => {
        const response = await request(app)
            .get('/api/suppliers')
            .set('Authorization', `Bearer ${managerToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data', expect.any(Array))
        expect(response.body).not.toHaveProperty('meta')

        const companyNames = response.body.data.map((supplier) => supplier.companyName)
        expect(companyNames).toContain('PT Sumber Makmur')
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).get('/api/suppliers')

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh lihat list supplier', async () => {
        const response = await request(app)
            .get('/api/suppliers')
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(403)
    })
})

describe('GET /api/suppliers/:id', () => {
    test('200 - berhasil ambil detail supplier', async () => {
        const response = await request(app)
            .get(`/api/suppliers/${supplierWithProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('companyName', 'PT Sumber Makmur')
    })

    test('404 - supplier tidak ditemukan', async () => {
        const response = await request(app)
            .get('/api/suppliers/99999')
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(404)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).get(`/api/suppliers/${supplierWithProduct.id}`)

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh lihat detail supplier', async () => {
        const response = await request(app)
            .get(`/api/suppliers/${supplierWithProduct.id}`)
            .set('Authorization', `Bearer ${staffToken}`)

        expect(response.status).toBe(403)
    })
})

describe('POST /api/suppliers', () => {
    test('201 - berhasil membuat supplier baru (manager)', async () => {
        const response = await request(app)
            .post('/api/suppliers')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
                companyName: 'PT Baru Jaya',
                contactPerson: 'Dedi',
                phone: '08123330000',
                email: 'dedi@barujaya.com',
                address: 'Semarang'
            })

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('companyName', 'PT Baru Jaya')
    })

    test('400 - gagal karena companyName tidak diisi', async () => {
        const response = await request(app)
            .post('/api/suppliers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ contactPerson: 'Tanpa Nama Perusahaan' })

        expect(response.status).toBe(400)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .post('/api/suppliers')
            .send({ companyName: 'PT Tanpa Token' })

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh membuat supplier', async () => {
        const response = await request(app)
            .post('/api/suppliers')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ companyName: 'PT Staff' })

        expect(response.status).toBe(403)
    })
})

describe('PUT /api/suppliers/:id', () => {
    test('200 - berhasil update supplier (admin)', async () => {
        const response = await request(app)
            .put(`/api/suppliers/${supplierEmpty.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ contactPerson: 'Citra Update' })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('contactPerson', 'Citra Update')
    })

    test('400 - gagal karena companyName dikirim kosong', async () => {
        const response = await request(app)
            .put(`/api/suppliers/${supplierEmpty.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ companyName: '' })

        expect(response.status).toBe(400)
    })

    test('401 - tanpa token', async () => {
        const response = await request(app)
            .put(`/api/suppliers/${supplierEmpty.id}`)
            .send({ contactPerson: 'Tanpa Token' })

        expect(response.status).toBe(401)
    })

    test('403 - role staff tidak boleh update supplier', async () => {
        const response = await request(app)
            .put(`/api/suppliers/${supplierEmpty.id}`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ contactPerson: 'Staff Update' })

        expect(response.status).toBe(403)
    })
})

describe('DELETE /api/suppliers/:id', () => {
    test('400 - gagal hapus karena masih punya produk aktif', async () => {
        const response = await request(app)
            .delete(`/api/suppliers/${supplierWithProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
    })

    test('400 - gagal hapus karena masih punya produk nonaktif (isActive: false)', async () => {
        const response = await request(app)
            .delete(`/api/suppliers/${supplierWithInactiveProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
    })

    test('200 - berhasil hapus supplier tanpa produk (admin)', async () => {
        const response = await request(app)
            .delete(`/api/suppliers/${supplierEmpty.id}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)

        const deleted = await Supplier.findByPk(supplierEmpty.id)
        expect(deleted).toBeNull()
    })

    test('401 - tanpa token', async () => {
        const response = await request(app).delete(`/api/suppliers/${supplierWithProduct.id}`)

        expect(response.status).toBe(401)
    })

    test('403 - role manager tidak boleh hapus supplier', async () => {
        const response = await request(app)
            .delete(`/api/suppliers/${supplierWithProduct.id}`)
            .set('Authorization', `Bearer ${managerToken}`)

        expect(response.status).toBe(403)
    })
})
