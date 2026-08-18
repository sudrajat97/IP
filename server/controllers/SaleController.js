const { Product, Sale, SaleItem, StockMovement, sequelize } = require('../models')

class SaleController {
    static async create(req, res, next) {
        const transaction = await sequelize.transaction()
        try {
            const { customerName, paymentStatus, items } = req.body

            if (!Array.isArray(items) || items.length === 0) {
                throw { name: 'BadRequest', message: 'Items tidak boleh kosong' }
            }

            let totalAmount = 0
            const saleItemsData = []

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
                if (product.quantity < item.quantity) {
                    throw { name: 'BadRequest', message: 'Stok tidak mencukupi' }
                }

                const quantityBefore = product.quantity
                product.quantity = quantityBefore - item.quantity
                await product.save({ transaction })

                await StockMovement.create({
                    ProductId: product.id,
                    type: 'sale',
                    quantity: item.quantity,
                    quantityBefore,
                    quantityAfter: product.quantity,
                    UserId: req.user.id
                }, { transaction })

                totalAmount += product.sellingPrice * item.quantity
                saleItemsData.push({
                    ProductId: product.id,
                    quantity: item.quantity,
                    priceAtSale: product.sellingPrice
                })
            }

            const sale = await Sale.create({
                customerName,
                paymentStatus,
                totalAmount,
                UserId: req.user.id
            }, { transaction })

            for (const saleItemData of saleItemsData) {
                await SaleItem.create({
                    ...saleItemData,
                    SaleId: sale.id
                }, { transaction })
            }

            await transaction.commit()
            res.status(201).json({
                message: 'Sale recorded',
                data: sale
            })
        } catch (error) {
            await transaction.rollback()
            next(error)
        }
    }
}

module.exports = SaleController
