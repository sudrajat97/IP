const request = require('supertest')
const app = require('../app')
const { sequelize, User } = require('../models')
const { queryInterface } = sequelize

const userData = {
    email: "admin@mail.com",
    password: "12345",
    role: "admin"
}

beforeAll(async () => {
    await User.create(userData)
})

afterAll(async () => {
    await queryInterface.bulkDelete('Users', null, {
        truncate: true,
        cascade: true,
        restartIdentity: true
    })
})

describe('POST /api/auth/register', () => {
    test('201 - berhasil register user baru', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: "staff@mail.com", password: "12345" })

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('email', 'staff@mail.com')
        expect(response.body.data).not.toHaveProperty('password')
    })

    test('400 - email sudah terdaftar', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: "admin@mail.com", password: "12345" })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('message', expect.any(String))
    })

    test('400 - email tidak diisi', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ password: "12345" })

        expect(response.status).toBe(400)
    })
})

describe('POST /api/auth/login', () => {
    test('200 - berhasil login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "admin@mail.com", password: "12345" })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('access_token', expect.any(String))
    })

    test('401 - password salah', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "admin@mail.com", password: "salah" })

        expect(response.status).toBe(401)
    })

    test('401 - email tidak terdaftar', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "tidakada@mail.com", password: "12345" })

        expect(response.status).toBe(401)
    })

    test('400 - password tidak diisi', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "admin@mail.com" })

        expect(response.status).toBe(400)
    })
})