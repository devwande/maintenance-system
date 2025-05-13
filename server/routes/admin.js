const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const Admin = require("../models/Admin")
const MaintenanceRequest = require("../models/MaintenanceRequest") // Import MaintenanceRequest model

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body

    // Validate input
    if (!name || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Find admin
    const admin = await Admin.findOne({ name })
    if (!admin) {
      return res.status(404).json({ message: "No admin account found with this name" })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" })
    }

    // Return admin data (excluding password)
    res.status(200).json({
      status: "success",
      message: "Login successful",
      admin: {
        _id: admin._id,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin assign endpoint
router.patch("/assign/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { category } = req.body

    // Ensure consistent category naming
    // This mapping should match the one in the worker route
    const categoryMap = {
      Electrical: "Electrical",
      Plumbing: "Plumbing",
      Carpentry: "Carpentry",
      // Add other categories as needed
    }

    // Use the mapped category or the original if no mapping exists
    const normalizedCategory = categoryMap[category] || category

    console.log(`Assigning request to category: ${normalizedCategory}`)

    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      id,
      { category: normalizedCategory },
      { new: true },
    )

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" })
    }

    res.json(updatedRequest)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
