import express from "express"
import { register,login, logout, AddProductForm } from "../controllers/auth.js"

const router = express.Router()

router.post("/register",register)
router.post("/Login",login)
router.post("/logout",logout)
router.post("/AddProductForm",AddProductForm)

export default router
