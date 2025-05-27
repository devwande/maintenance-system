import "dotenv/config"
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import WorkerModel from "./models/Worker.js"
import AdminModel from "./models/Admin.js"
import MaintenanceRequest from "./models/MaintenanceRequest.js"
import authRoutes from "./routes/authRoutes.js"
import requestRoutes from "./routes/requestRoutes.js"
import { getWorkerStatistics } from "./services/workerAssignmentService.js"
import { getPrioritizedRequests } from "./services/prioritizationService.js"

const app = express()

// Serve static files from uploads directory
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

// Middleware
app.use(cors({ credentials: true }))
app.use(express.json())

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/", authRoutes)
app.use("/api/requests", requestRoutes)

// Admin routes
app.get("/api/admin/requests", async (req, res) => {
  try {
    const { status, category } = req.query
    const query = {}

    if (status) query.status = status
    if (category) query.category = category

    const requests = await MaintenanceRequest.find(query).populate("assignedTo", "name role").sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

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

app.get("/api/admin/worker-statistics", async (req, res) => {
  try {
    const workerStats = await getWorkerStatistics()
    res.json(workerStats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Worker routes
app.get("/api/worker/requests/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params
    const { status } = req.query

    const query = { assignedTo: workerId }
    if (status) query.status = status

    const requests = await MaintenanceRequest.find(query).populate("assignedTo", "name role").sort({ createdAt: -1 })

    res.json(requests)
  } catch (error) {
    console.error("Error fetching worker requests:", error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/worker/available-requests/:role", async (req, res) => {
  try {
    const { role } = req.params
    const { status } = req.query

    const roleToCategoryMap = {
      Electrician: "Electrical",
      Plumber: "Plumbing",
      Carpenter: "Carpenter",
      HVAC: "HVAC",
      Other: "Other",
    }

    const category = roleToCategoryMap[role] || role
    const query = {
      category,
      assignedTo: { $exists: false },
    }
    if (status) query.status = status

    const requests = await MaintenanceRequest.find(query).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error("Error fetching available requests:", error)
    res.status(500).json({ error: error.message })
  }
})

// Test endpoint
app.get("/api/test/worker-distribution", async (req, res) => {
  try {
    const workers = await WorkerModel.find({}, "name role")

    const distribution = await Promise.all(
      workers.map(async (worker) => {
        const pendingCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: "Pending",
        })

        const inProgressCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: "In Progress",
        })

        const completedCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: "Completed",
        })

        return {
          workerId: worker._id,
          name: worker.name,
          role: worker.role,
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount,
          active: pendingCount + inProgressCount,
          total: pendingCount + inProgressCount + completedCount,
        }
      }),
    )

    res.json({
      message: "Worker distribution analysis",
      workers: distribution,
      totalWorkers: workers.length,
    })
  } catch (error) {
    console.error("Error getting worker distribution:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create initial admin
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

mongoose.connection.once("open", () => {
  createInitialAdmin()
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
