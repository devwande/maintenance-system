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
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/"
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

// Admin routes with dormitory filtering
app.get("/api/admin/requests", async (req, res) => {
  try {
    const { status, category, dormitory, month, year } = req.query
    const query = {}

    if (status) query.status = status
    if (category) query.category = category
    if (dormitory && dormitory !== "All") query.dormitory = dormitory

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      query.createdAt = { $gte: startDate, $lte: endDate }
    }

    const requests = await MaintenanceRequest.find(query).populate("assignedTo", "name role").sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/admin/prioritized-requests", async (req, res) => {
  try {
    const { status, category, dormitory } = req.query
    const filters = {}
    if (status) filters.status = status
    if (category) filters.category = category
    if (dormitory && dormitory !== "All") filters.dormitory = dormitory

    const prioritizedRequests = await getPrioritizedRequests(filters)
    res.json(prioritizedRequests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/admin/worker-statistics", async (req, res) => {
  try {
    const { dormitory } = req.query
    const workerStats = await getWorkerStatistics(dormitory)
    res.json(workerStats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Export routes
app.get("/api/admin/export", async (req, res) => {
  try {
    const { type, dormitory, month, year } = req.query
    const query = {}

    if (type === "hall" && dormitory && dormitory !== "All") {
      query.dormitory = dormitory
    } else if (type === "month" && month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      query.createdAt = { $gte: startDate, $lte: endDate }
    }
    // For 'full' type, no additional filters needed

    const requests = await MaintenanceRequest.find(query).populate("assignedTo", "name role").sort({ createdAt: -1 })

    res.json(requests)
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

// Create initial admins
const createInitialAdmins = async () => {
  try {
    const dormitories = [
      "Peter Hall",
      "Paul Hall",
      "John Hall",
      "Joseph Hall",
      "Daniel Hall",
      "Esther Hall",
      "Mary Hall",
      "Deborah Hall",
      "Lydia Hall",
      "Dorcas Hall",
    ]

    // Create general admin if it doesn't exist
    const generalAdminExists = await AdminModel.findOne({ name: "admin" })
    if (!generalAdminExists) {
      await AdminModel.create({
        name: "admin",
        password: "admin123",
      })
      console.log("General admin account created")
    }

    // Create hall-specific admins
    for (const hall of dormitories) {
      const adminName = `${hall.toLowerCase().replace(" ", "_")}_admin`
      const adminExists = await AdminModel.findOne({ name: adminName })

      if (!adminExists) {
        await AdminModel.create({
          name: adminName,
          password: "admin123",
        })
        console.log(`Admin account created for ${hall}: ${adminName}`)
      }
    }

    console.log("All admin accounts initialized successfully")
  } catch (error) {
    console.error("Error creating initial admins:", error)
  }
}

mongoose.connection.once("open", () => {
  createInitialAdmins()
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
