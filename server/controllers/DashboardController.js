const { Op } = require('sequelize')
const { Product, Sale, sequelize } = require('../models')

class DashboardController {
    static async summary(req, res, next) {
        try {
            const now = new Date()
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const startOfTomorrow = new Date(startOfToday)
            startOfTomorrow.setDate(startOfToday.getDate() + 1)

            const totalProducts = await Product.count({
                where: { isActive: true }
            })

            const totalCategories = await Product.count({
                where: { isActive: true },
                distinct: true,
                col: 'category'
            })

            const lowStockCount = await Product.count({
                where: {
                    isActive: true,
                    quantity: { [Op.lte]: sequelize.col('minStock') }
                }
            })

            const inventoryValue = await Product.findOne({
                attributes: [
                    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal('"quantity" * "purchasePrice"')), 0), 'totalInventoryValue']
                ],
                where: { isActive: true },
                raw: true
            })

            const todaySales = await Sale.findOne({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'todaySalesCount'],
                    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('totalAmount')), 0), 'todaySalesAmount']
                ],
                where: {
                    createdAt: { [Op.gte]: startOfToday, [Op.lt]: startOfTomorrow }
                },
                raw: true
            })

            res.status(200).json({
                message: 'Success get dashboard summary',
                data: {
                    totalProducts,
                    totalCategories,
                    lowStockCount,
                    todaySalesCount: Number(todaySales.todaySalesCount),
                    todaySalesAmount: Number(todaySales.todaySalesAmount),
                    totalInventoryValue: Number(inventoryValue.totalInventoryValue)
                }
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = DashboardController
