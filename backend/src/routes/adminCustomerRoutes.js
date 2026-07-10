import { Router } from 'express'
import { getAdminCustomer, listAdminCustomers } from '../controllers/adminCustomerController.js'
import { authenticateAdmin } from '../middleware/authenticateAdmin.js'

const router = Router()

router.use(authenticateAdmin)
router.get('/', listAdminCustomers)
router.get('/:id', getAdminCustomer)

export default router
