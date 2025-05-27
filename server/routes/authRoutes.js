import express from "express"
import {
  studentLogin,
  studentRegister,
  workerLogin,
  workerRegister,
  adminLogin,
  resetPassword,
} from "../controllers/authController.js"

const router = express.Router()

// Student routes
router.post("/login", studentLogin)
router.post("/register", studentRegister)

// Worker routes
router.post("/worker/login", workerLogin)
router.post("/worker/register", workerRegister)

// Admin routes
router.post("/admin/login", adminLogin)

// Password reset
router.post("/reset-password", resetPassword)

export default router
