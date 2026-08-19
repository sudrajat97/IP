const express = require('express')
const SupplierController = require('../controllers/SupplierController')
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const router = express.Router()

router.use(authentication)

router.get('/', authorization(['admin', 'manager']), SupplierController.findAll)
router.get('/:id', authorization(['admin', 'manager']), SupplierController.findOne)
router.post('/', authorization(['admin', 'manager']), SupplierController.create)
router.put('/:id', authorization(['admin', 'manager']), SupplierController.update)
router.delete('/:id', authorization(['admin']), SupplierController.destroy)

module.exports = router
