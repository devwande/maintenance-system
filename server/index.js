import "dotenv/config"
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import StudentModel from "./models/Student.js"
import WorkerModel from "./models/Worker.js"
import AdminModel from "./models/Admin.js"
import MaintenanceRequest from "./models/MaintenanceRequest.js"
import multer from "multer"
import { assignWorkerToRequest, getWorkerStatistics } from "./services/workerAssignmentService.js"
import { getPrioritizedRequests, updateRequestPriority } from "./services/prioritizationService.js"
import { rateMaintenanceRequest } from "./services/workerPerformanceService.js"

const app = express()

app.use("/server/uploads", express.static("uploads"))

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student"
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "90d"

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables")
  process.exit(1)
}

app.use(
  cors({
    // origin: 'http://localhost:5174',
    credentials: true,
  }),
)
app.use(express.json())

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

// Student Login
app.post("/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body

    if (!regNumber || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide registration number and password",
      })
    }

    const user = await StudentModel.findOne({ regNumber }).select("+password")

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect registration number or password",
      })
    }

    const token = signToken(user.regNumber, "student")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          name: user.name,
          regNumber: user.regNumber,
          email: user.email,
          dormitory: user.dormitory,
          role: "student",
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
})

// Worker Login
app.post("/worker/login", async (req, res) => {
  try {
    const { name, password, role } = req.body

    if (!name || !password || !role) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, password and role",
      })
    }

    const worker = await WorkerModel.findOne({ name, role }).select("+password")

    if (!worker || !(await worker.correctPassword(password, worker.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect credentials",
      })
    }

    const token = signToken(worker._id, "worker")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: worker._id,
          name: worker.name,
          role: worker.role,
          userType: "worker",
        },
      },
    })
  } catch (error) {
    console.error("Worker login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
})

app.post("/worker/register", async (req, res) => {
  try {
    const { name, role, password } = req.body

    if (!name || !role || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      })
    }

    const newWorker = await WorkerModel.create({
      name,
      role,
      password,
    })

    const token = signToken(newWorker._id, "worker")

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          id: newWorker._id,
          name: newWorker.name,
          role: newWorker.role,
          userType: "worker",
        },
      },
    })
  } catch (error) {
    console.error("Worker registration error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(409).json({
        status: "fail",
        message: `${field} already in use`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
    })
  }
})

// Admin Login
app.post("/admin/login", async (req, res) => {
  try {
    const { name, password } = req.body

    if (!name || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name and password",
      })
    }

    const admin = await AdminModel.findOne({ name }).select("+password")

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect credentials",
      })
    }

    const token = signToken(admin._id, "admin")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          userType: "admin",
        },
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
})

// Create initial admin if none exists
const createInitialAdmin = async () => {
  try {
    const adminCount = await AdminModel.countDocuments()
    if (adminCount === 0) {
      await AdminModel.create({
        name: "admin",
        password: "admin123",
      })
      console.log("Initial admin account created")
    }
  } catch (error) {
    console.error("Error creating initial admin:", error)
  }
}

// Student Registration
app.post("/register", async (req, res) => {
  try {
    const { name, regNumber, email, dormitory, password } = req.body

    if (!name || !regNumber || !email || !dormitory || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      })
    }

    const newStudent = await StudentModel.create({
      name,
      regNumber,
      email,
      dormitory,
      password,
    })

    const token = signToken(newStudent.regNumber, "student")

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newStudent,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(409).json({
        status: "fail",
        message: `${field} already in use`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
    })
  }
})

app.get("/protected", async (req, res) => {
  try {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const currentUser = await StudentModel.findOne({ regNumber: decoded.regNumber })
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        user: currentUser,
      },
    })
  } catch (error) {
    console.error("Protected route error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

// Create maintenance request with auto-assignment
app.post("/api/requests", upload.single("image"), async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      studentRegNumber: req.body.studentRegNumber,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    }

    // Create the request
    const request = await MaintenanceRequest.create(requestData)

    // Auto-assign to a worker if not already assigned
    if (!request.assignedTo && request.category) {
      await assignWorkerToRequest(request._id)
    }

    res.status(201).json(request)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get requests by student registration number
app.get("/api/requests/:regNumber", async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ studentRegNumber: req.params.regNumber }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Get all requests (for admin)
app.get("/api/admin/requests", async (req, res) => {
  try {
    const { status, category } = req.query

    const query = {}

    if (status) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    const requests = await MaintenanceRequest.find(query).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Get prioritized requests for admin
app.get("/api/admin/prioritized-requests", async (req, res) => {
  try {
    const { status, category } = req.query

    const filters = {}
    if (status) filters.status = status
    if (category) filters.category = category

    const prioritizedRequests = await getPrioritizedRequests(filters)
    res.json(prioritizedRequests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Update request priority
app.patch("/api/admin/priority/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { priority } = req.body

    const updatedRequest = await updateRequestPriority(id, priority)
    res.json(updatedRequest)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Admin assign endpoint
app.patch("/api/admin/assign/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { category } = req.body

    // Ensure consistent category naming
    const categoryMap = {
      Electrical: "Electrical",
      Plumbing: "Plumbing",
      Carpenter: "Carpenter",
      HVAC: "HVAC",
      Other: "Other",
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

// Worker requests endpoint
app.get("/api/worker/requests/:role", async (req, res) => {
  try {
    const { role } = req.params
    const { status } = req.query

    console.log(`Worker role received: ${role}`)

    // Create a mapping between worker roles and request categories
    const roleToCategoryMap = {
      Electrician: "Electrical",
      Plumber: "Plumbing",
      Carpenter: "Carpenter",
      HVAC: "HVAC",
      Other: "Other",
    }

    // Get the corresponding category for this role
    const category = roleToCategoryMap[role] || role

    console.log(`Looking for requests with category: ${category}`)

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

// Update request status with completion time tracking
app.patch("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { status, workerFeedback } = req.body

    const request = await MaintenanceRequest.findById(id)

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    // If marking as completed, record completion time
    if (status === "Completed" && request.status !== "Completed") {
      request.completedAt = new Date()

      // Calculate resolution time if assigned time exists
      if (request.assignedAt) {
        const assignedTime = new Date(request.assignedAt).getTime()
        const completedTime = request.completedAt.getTime()
        request.resolutionTime = (completedTime - assignedTime) / (1000 * 60 * 60) // hours
      }
    }

    request.status = status
    if (workerFeedback) {
      request.workerFeedback = workerFeedback
    }

    await request.save()

    res.json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Rate a completed maintenance request
app.post("/api/requests/:id/rate", async (req, res) => {
  try {
    const { id } = req.params
    const { rating } = req.body

    const result = await rateMaintenanceRequest(id, rating)

    if (!result.success) {
      return res.status(400).json({ error: result.message })
    }

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Get worker statistics for admin dashboard
app.get("/api/admin/worker-statistics", async (req, res) => {
  try {
    const workerStats = await getWorkerStatistics()
    res.json(workerStats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Create initial admin account when server starts
mongoose.connection.once("open", () => {
  createInitialAdmin()
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
