import MaintenanceRequest from "../models/MaintenanceRequest.js"
import { assignWorkerToRequest } from "../services/workerAssignmentService.js"
import { rateMaintenanceRequest } from "../services/workerPerformanceService.js"

export const createRequest = async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      studentRegNumber: req.body.studentRegNumber,
      imageData: req.file ? req.file.buffer.toString("base64") : null,
      imageContentType: req.file ? req.file.mimetype : null,
    }

    console.log("Creating new request:", requestData.title)

    const request = await MaintenanceRequest.create(requestData)
    console.log("Request created with ID:", request._id)

    // Auto-assign to a worker
    if (!request.assignedTo && request.category) {
      console.log(`🔄 Starting auto-assignment for request ${request._id}`)
      const assignmentResult = await assignWorkerToRequest(request._id, false)

      if (assignmentResult.success) {
        console.log(`✅ Auto-assignment successful: ${assignmentResult.message}`)
      } else {
        console.log(`❌ Auto-assignment failed: ${assignmentResult.message}`)
      }
    }

    const updatedRequest = await MaintenanceRequest.findById(request._id).populate("assignedTo", "name role")
    res.status(201).json(updatedRequest)
  } catch (error) {
    console.error("Error creating request:", error)
    res.status(500).json({ error: error.message })
  }
}

export const getStudentRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({
      studentRegNumber: req.params.regNumber,
    }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const getAdminRequests = async (req, res) => {
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
}

export const getWorkerRequests = async (req, res) => {
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
}

export const getAvailableRequests = async (req, res) => {
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
}

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, workerFeedback } = req.body

    const request = await MaintenanceRequest.findById(id)
    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    if (status === "Completed" && request.status !== "Completed") {
      request.completedAt = new Date()
      if (request.assignedAt) {
        const assignedTime = new Date(request.assignedAt).getTime()
        const completedTime = request.completedAt.getTime()
        request.resolutionTime = (completedTime - assignedTime) / (1000 * 60 * 60)
      }
    }

    request.status = status
    if (workerFeedback !== undefined) {
      request.workerFeedback = workerFeedback
    }

    await request.save()
    res.json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const addFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const { workerFeedback } = req.body

    const request = await MaintenanceRequest.findByIdAndUpdate(id, { workerFeedback }, { new: true }).populate(
      "assignedTo",
      "name role",
    )

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    res.json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params

    const request = await MaintenanceRequest.findByIdAndUpdate(
      id,
      { $unset: { workerFeedback: "" } },
      { new: true },
    ).populate("assignedTo", "name role")

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    res.json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const rateRequest = async (req, res) => {
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
}

export const getRequestImage = async (req, res) => {
  try {
    const { id } = req.params
    const request = await MaintenanceRequest.findById(id)

    if (!request || !request.imageData) {
      return res.status(404).json({ error: "Image not found" })
    }

    const imageBuffer = Buffer.from(request.imageData, "base64")

    // Set proper headers for image serving
    res.set({
      "Content-Type": request.imageContentType,
      "Content-Length": imageBuffer.length,
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    })

    res.send(imageBuffer)
  } catch (error) {
    console.error("Error serving image:", error)
    res.status(500).json({ error: error.message })
  }
}
