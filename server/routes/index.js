const express = require('express')
const authRouter = require('./auth')
const productRouter = require('./product')
const purchaseRouter = require('./purchase')
const saleRouter = require('./sale')
const supplierRouter = require('./supplier')

const router = express.Router()

router.use('/auth', authRouter)
router.use('/products', productRouter)
router.use('/purchases', purchaseRouter)
router.use('/sales', saleRouter)
router.use('/suppliers', supplierRouter)

module.exports = router