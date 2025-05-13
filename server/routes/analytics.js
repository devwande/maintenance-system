const express = require("express")
const router = express.Router()
const Request = require("../models/Request")

// Get analytics data
router.get("/", async (req, res) => {
  try {
    const { period } = req.query

    // Define date range based on period
    let dateFilter = {}
    const now = new Date()

    if (period === "week") {
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)
      dateFilter = { createdAt: { $gte: lastWeek } }
    } else if (period === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      dateFilter = { createdAt: { $gte: lastMonth } }
    }

    // Get all requests within the date range
    const requests = await Request.find(dateFilter)

    // Calculate analytics
    const totalRequests = requests.length
    const pendingRequests = requests.filter((r) => r.status === "Pending").length
    const inProgressRequests = requests.filter((r) => r.status === "In Progress").length
    const completedRequests = requests.filter((r) => r.status === "Completed").length

    // Category breakdown
    const categoryBreakdown = {}
    requests.forEach((request) => {
      if (!categoryBreakdown[request.category]) {
        categoryBreakdown[request.category] = 0
      }
      categoryBreakdown[request.category]++
    })

    // Dormitory breakdown
    const dormitoryBreakdown = {}
    requests.forEach((request) => {
      // Extract dormitory name from location (assuming format like "Hall A - Room 101")
      const match = request.location.match(/^([^-]+)/)
      const dormitory = match ? match[0].trim() : request.location

      if (!dormitoryBreakdown[dormitory]) {
        dormitoryBreakdown[dormitory] = 0
      }
      dormitoryBreakdown[dormitory]++
    })

    // Monthly requests
    const monthlyRequests = {}
    requests.forEach((request) => {
      const month = new Date(request.createdAt).toLocaleString("default", { month: "short" })
      if (!monthlyRequests[month]) {
        monthlyRequests[month] = 0
      }
      monthlyRequests[month]++
    })

    // Average resolution time (for completed requests)
    let totalResolutionTime = 0
    let completedCount = 0

    requests.forEach((request) => {
      if (request.status === "Completed" && request.completedAt) {
        const createdDate = new Date(request.createdAt)
        const completedDate = new Date(request.completedAt)
        const resolutionTime = (completedDate - createdDate) / (1000 * 60 * 60) // in hours
        totalResolutionTime += resolutionTime
        completedCount++
      }
    })

    const averageResolutionTime = completedCount > 0 ? totalResolutionTime / completedCount : 0

    res.status(200).json({
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      categoryBreakdown,
      dormitoryBreakdown,
      monthlyRequests,
      averageResolutionTime,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
