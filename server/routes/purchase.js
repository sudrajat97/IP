const express = require('express')
const PurchaseController = require('../controllers/PurchaseController')
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const router = express.Router()

router.use(authentication)

router.post('/', authorization(['admin', 'manager']), PurchaseController.create)

module.exports = router
