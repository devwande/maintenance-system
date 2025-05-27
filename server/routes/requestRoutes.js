import express from "express"
import multer from "multer"
import {
  createRequest,
  getStudentRequests,
  getAdminRequests,
  getWorkerRequests,
  getAvailableRequests,
  updateRequestStatus,
  addFeedback,
  deleteFeedback,
  rateRequest,
  getRequestImage,
} from "../controllers/requestController.js"

const router = express.Router()

// Configure multer for memory storage (database storage)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const extname = filetypes.test(file.originalname.toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"))
    }
  },
})

// Request routes
router.post("/", upload.single("image"), createRequest)
router.get("/student/:regNumber", getStudentRequests)
router.get("/admin", getAdminRequests)
router.get("/worker/:workerId", getWorkerRequests)
router.get("/available/:role", getAvailableRequests)
router.get("/image/:id", getRequestImage)

// Request updates
router.patch("/:id", updateRequestStatus)
router.patch("/:id/feedback", addFeedback)
router.delete("/:id/feedback", deleteFeedback)
router.post("/:id/rate", rateRequest)

export default router
