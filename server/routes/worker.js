const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const Worker = require("../models/Worker")
const MaintenanceRequest = require("../models/MaintenanceRequest") // Assuming you have this model

// Worker registration
router.post("/register", async (req, res) => {
  try {
    const { name, role, password } = req.body

    // Validate input
    if (!name || !role || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if worker already exists
    const existingWorker = await Worker.findOne({ name, role })
    if (existingWorker) {
      return res.status(409).json({ message: "A worker with this name and role already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new worker
    const newWorker = new Worker({
      name,
      role,
      password: hashedPassword,
    })

    await newWorker.save()

    res.status(201).json({
      message: "Worker registered successfully",
      worker: {
        _id: newWorker._id,
        name: newWorker.name,
        role: newWorker.role,
      },
    })
  } catch (error) {
    console.error("Worker registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Worker login
router.post("/login", async (req, res) => {
  try {
    const { name, password, role } = req.body

    // Validate input
    if (!name || !password || !role) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Find worker
    const worker = await Worker.findOne({ name, role })
    if (!worker) {
      return res.status(404).json({ message: "No account found with this name and role" })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, worker.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" })
    }

    // Return worker data (excluding password)
    res.status(200).json({
      status: "success",
      message: "Login successful",
      worker: {
        _id: worker._id,
        name: worker.name,
        role: worker.role,
      },
    })
  } catch (error) {
    console.error("Worker login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Worker requests endpoint
router.get("/requests/:role", async (req, res) => {
  try {
    const { role } = req.params
    const { status } = req.query

    console.log(`Worker role received: ${role}`)

    // Create a mapping between worker roles and request categories
    const roleToCategoryMap = {
      Electrician: "Electrical",
      Plumber: "Plumbing",
      Carpenter: "Carpentry",
      HVAC: "HVAC",
      // Add other mappings as needed
    }

    // Get the corresponding category for this role
    const category = roleToCategoryMap[role] || role

    console.log(`Looking for requests with category: ${category}`)

    // Log all unique categories in the database for debugging
    const allCategories = await MaintenanceRequest.distinct("category")
    console.log("All categories in database:", allCategories)

    // Build the query
    const query = { category }
    if (status) {
      query.status = status
    }

    console.log("Query:", query)

    const requests = await MaintenanceRequest.find(query).sort({ createdAt: -1 })
    console.log(`Found ${requests.length} requests`)

    res.json(requests)
  } catch (error) {
    console.error("Error fetching worker requests:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
