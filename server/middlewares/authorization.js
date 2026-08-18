function authorization(allowedRoles) {
    return (req, res, next) => {
        try {
            if (!allowedRoles.includes(req.user.role)) {
                throw { name: 'Forbidden' }
            }
            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = authorization
