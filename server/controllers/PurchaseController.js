const { Product, StockMovement, sequelize } = require('../models')

class PurchaseController {
    static async create(req, res, next) {
        const transaction = await sequelize.transaction()
        try {
            const { SupplierId, items } = req.body

            if (!Array.isArray(items) || items.length === 0) {
                throw { name: 'BadRequest', message: 'Items tidak boleh kosong' }
            }

            const note = SupplierId ? `Purchase dari SupplierId ${SupplierId}` : null
            const movements = []

            for (const item of items) {
                if (!item.quantity || item.quantity < 1) {
                    throw { name: 'BadRequest', message: 'Quantity harus lebih dari 0' }
                }

                const product = await Product.findByPk(item.ProductId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                })

                if (!product) {
                    throw { name: 'NotFound', message: `Product id ${item.ProductId} tidak ditemukan` }
                }

                const quantityBefore = product.quantity
                product.quantity = quantityBefore + item.quantity
                await product.save({ transaction })

                const movement = await StockMovement.create({
                    ProductId: product.id,
                    type: 'purchase',
                    quantity: item.quantity,
                    quantityBefore,
                    quantityAfter: product.quantity,
                    UserId: req.user.id,
                    note
                }, { transaction })

                movements.push(movement)
            }

            await transaction.commit()
            res.status(201).json({
                message: 'Purchase recorded',
                data: { SupplierId, movements }
            })
        } catch (error) {
            await transaction.rollback()
            next(error)
        }
    }
}

module.exports = PurchaseController
