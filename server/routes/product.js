const express = require('express')
const ProductController = require('../controllers/ProductController')
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const router = express.Router()

router.use(authentication)

router.get('/', ProductController.findAll)
router.get('/:id', ProductController.findOne)
router.post('/', authorization(['admin', 'manager']), ProductController.create)
router.put('/:id', authorization(['admin', 'manager']), ProductController.update)
router.delete('/:id', authorization(['admin']), ProductController.destroy)

module.exports = router
