const { verifyToken } = require('../helpers/jwt')
const { User } = require('../models')

async function authentication(req, res, next) {
    try {
        const bearerToken = req.headers.authorization
        if (!bearerToken) {
            throw { name: 'Unauthorized', message: 'Token tidak ditemukan' }
        }

        const token = bearerToken.split(' ')[1]
        const payload = verifyToken(token)

        const user = await User.findByPk(payload.id)
        if (!user) {
            throw { name: 'Unauthorized', message: 'Token tidak valid' }
        }

        req.user = { id: user.id, email: user.email, role: user.role }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = authentication
