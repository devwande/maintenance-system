const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const MaintenanceRequest = require("../models/MaintenanceRequest")
const Worker = require("../models/Worker")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"))
    }
  },
})

// Create a new maintenance request
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, category, location, description, studentRegNumber } = req.body

    // Validate required fields
    if (!title || !category || !location || !description || !studentRegNumber) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Create new request
    const newRequest = new MaintenanceRequest({
      title,
      category,
      location,
      description,
      studentRegNumber,
      status: "Pending",
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    })

    await newRequest.save()

    res.status(201).json({
      message: "Maintenance request submitted successfully",
      request: newRequest,
    })
  } catch (error) {
    console.error("Error creating request:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all requests for a specific student
router.get("/:regNumber", async (req, res) => {
  try {
    const { regNumber } = req.params

    const requests = await MaintenanceRequest.find({ studentRegNumber: regNumber }).sort({ createdAt: -1 })

    res.status(200).json(requests)
  } catch (error) {
    console.error("Error fetching requests:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all requests (for admin)
router.get("/", async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find().sort({ createdAt: -1 })

    res.status(200).json(requests)
  } catch (error) {
    console.error("Error fetching all requests:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get requests for a specific worker based on their role
router.get("/worker/:role", async (req, res) => {
  try {
    const { role } = req.params

    // Find requests that match the worker's role or are assigned to this worker
    const requests = await MaintenanceRequest.find({
      $or: [{ category: role }, { assignedTo: req.query.workerId }],
    }).sort({ createdAt: -1 })

    res.status(200).json(requests)
  } catch (error) {
    console.error("Error fetching worker requests:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update request status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status, feedback, workerName } = req.body

    // Validate status
    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const request = await Request.findById(id)
    if (!request) {
      return res.status(404).json({ message: "Request not found" })
    }

    // Update request
    request.status = status
    if (feedback) {
      request.feedback = feedback
    }
    if (workerName) {
      request.workerName = workerName
    }

    // If status is completed, set completedAt
    if (status === "Completed" && !request.completedAt) {
      request.completedAt = new Date()
    }

    await request.save()

    res.status(200).json({
      message: "Request status updated successfully",
      request,
    })
  } catch (error) {
    console.error("Error updating request status:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Assign worker to request
router.put("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params
    const { workerId } = req.body

    // Validate workerId
    if (!workerId) {
      return res.status(400).json({ message: "Worker ID is required" })
    }

    const request = await Request.findById(id)
    if (!request) {
      return res.status(404).json({ message: "Request not found" })
    }

    const worker = await Worker.findById(workerId)
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" })
    }

    // Update request
    request.assignedTo = worker.name
    request.assignedWorkerId = workerId

    // If request is pending, update to in progress
    if (request.status === "Pending") {
      request.status = "In Progress"
    }

    await request.save()

    res.status(200).json({
      message: "Worker assigned successfully",
      request,
    })
  } catch (error) {
    console.error("Error assigning worker:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all workers
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, { password: 0 }) // Exclude password
    res.status(200).json(workers)
  } catch (error) {
    console.error("Error fetching workers:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
