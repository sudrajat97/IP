const express = require('express')
const DashboardController = require('../controllers/DashboardController')
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const router = express.Router()

router.use(authentication)

router.get('/summary', authorization(['admin', 'manager']), DashboardController.summary)

module.exports = router
