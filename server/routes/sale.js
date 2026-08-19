const express = require('express')
const SaleController = require('../controllers/SaleController')
const authentication = require('../middlewares/authentication')

const router = express.Router()

router.use(authentication)

router.post('/', SaleController.create)

module.exports = router
