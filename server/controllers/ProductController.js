const { Op } = require('sequelize')
const { Product, sequelize } = require('../models')

class ProductController {
    static async findAll(req, res, next) {
        try {
            const { search, category, sort, lowStock } = req.query
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 10

            const where = { isActive: true }

            if (search) {
                where.name = { [Op.iLike]: `%${search}%` }
            }
            if (category) {
                where.category = category
            }
            if (lowStock === 'true') {
                where.quantity = { [Op.lte]: sequelize.col('minStock') }
            }

            let order = [['id', 'ASC']]
            if (sort) {
                const isDescending = sort.startsWith('-')
                const sortField = isDescending ? sort.slice(1) : sort
                order = [[sortField, isDescending ? 'DESC' : 'ASC']]
            }

            const { count, rows } = await Product.findAndCountAll({
                where,
                order,
                limit,
                offset: (page - 1) * limit
            })

            res.status(200).json({
                data: rows,
                meta: {
                    page,
                    limit,
                    totalItems: count,
                    totalPages: Math.ceil(count / limit)
                }
            })
        } catch (error) {
            next(error)
        }
    }

    static async findOne(req, res, next) {
        try {
            const { id } = req.params
            const product = await Product.findByPk(id)

            if (!product) {
                throw { name: 'NotFound', message: 'Product not found' }
            }

            // produk yang sudah soft delete hanya boleh dilihat admin/manager
            if (!product.isActive && req.user.role === 'staff') {
                throw { name: 'NotFound', message: 'Product not found' }
            }

            res.status(200).json({
                message: 'Success get Product',
                data: product
            })
        } catch (error) {
            next(error)
        }
    }

    static async create(req, res, next) {
        try {
            const { name, sku, category, brand, purchasePrice, sellingPrice, quantity, minStock, SupplierId } = req.body
            const product = await Product.create({
                name, sku, category, brand, purchasePrice, sellingPrice, quantity, minStock, SupplierId
            })

            res.status(201).json({
                message: 'Product created',
                data: product
            })
        } catch (error) {
            next(error)
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params
            const product = await Product.findByPk(id)

            if (!product) {
                throw { name: 'NotFound', message: 'Product not found' }
            }

            // sku sengaja tidak ikut destructure: sku immutable sesuai ARCHITECTURE.md §4
            const { name, category, brand, purchasePrice, sellingPrice, quantity, minStock, SupplierId } = req.body
            await product.update({
                name, category, brand, purchasePrice, sellingPrice, quantity, minStock, SupplierId
            })

            res.status(200).json({
                message: 'Product updated',
                data: product
            })
        } catch (error) {
            next(error)
        }
    }

    static async destroy(req, res, next) {
        try {
            const { id } = req.params
            const product = await Product.findByPk(id)

            if (!product) {
                throw { name: 'NotFound', message: 'Product not found' }
            }

            product.isActive = false
            await product.save()

            res.status(200).json({
                message: 'Product deleted',
                data: product
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = ProductController
