const { Supplier, Product } = require('../models')

class SupplierController {
    static async findAll(req, res, next) {
        try {
            const suppliers = await Supplier.findAll({
                order: [['id', 'ASC']]
            })

            res.status(200).json({
                message: 'Success get Suppliers',
                data: suppliers
            })
        } catch (error) {
            next(error)
        }
    }

    static async findOne(req, res, next) {
        try {
            const { id } = req.params
            const supplier = await Supplier.findByPk(id)

            if (!supplier) {
                throw { name: 'NotFound', message: 'Supplier not found' }
            }

            res.status(200).json({
                message: 'Success get Supplier',
                data: supplier
            })
        } catch (error) {
            next(error)
        }
    }

    static async create(req, res, next) {
        try {
            const { companyName, contactPerson, phone, email, address } = req.body

            if (!companyName) {
                throw { name: 'BadRequest', message: 'Company name wajib diisi' }
            }

            const supplier = await Supplier.create({
                companyName, contactPerson, phone, email, address
            })

            res.status(201).json({
                message: 'Supplier created',
                data: supplier
            })
        } catch (error) {
            next(error)
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params
            const supplier = await Supplier.findByPk(id)

            if (!supplier) {
                throw { name: 'NotFound', message: 'Supplier not found' }
            }

            const { companyName, contactPerson, phone, email, address } = req.body

            if (companyName !== undefined && !companyName) {
                throw { name: 'BadRequest', message: 'Company name wajib diisi' }
            }

            await supplier.update({
                companyName, contactPerson, phone, email, address
            })

            res.status(200).json({
                message: 'Supplier updated',
                data: supplier
            })
        } catch (error) {
            next(error)
        }
    }

    static async destroy(req, res, next) {
        try {
            const { id } = req.params
            const supplier = await Supplier.findByPk(id)

            if (!supplier) {
                throw { name: 'NotFound', message: 'Supplier not found' }
            }

            const productCount = await Product.count({ where: { SupplierId: id } })
            if (productCount > 0) {
                throw { name: 'BadRequest', message: 'Supplier masih memiliki produk, tidak bisa dihapus' }
            }

            await supplier.destroy()

            res.status(200).json({
                message: 'Supplier deleted',
                data: supplier
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = SupplierController
