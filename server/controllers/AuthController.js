const { User } = require("../models")
const { comparePassword } = require("../helpers/bcrypt")
const { signToken } = require("../helpers/jwt")

class AuthController {
    static async register(req, res, next) {
        try {
            const { email, password, role } = req.body
            const user = await User.create({
                email, password, role
            })
            res.status(201).json({
                message: "Success create new User",
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            })
        } catch (error) {
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body
            if (!email || !password) {
                throw { name: "BadRequest", message: "Please input email or password" }
            }

            const user = await User.findOne({
                where: {
                    email
                }
            })
            if (!user) {
                throw { name: "LoginError" }
            }

            const isValidPassword = comparePassword(password, user.password)
            if (!isValidPassword) {
                throw { name: "LoginError" }
            }

            const access_token = signToken({
                id: user.id,
                email: user.email,
                role: user.role
            })

            res.status(200).json({
                access_token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = AuthController