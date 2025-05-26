import WorkerModel from "../models/Worker.js"
import MaintenanceRequest from "../models/MaintenanceRequest.js"

/**
 * Calculate worker performance score based on ratings and resolution time
 * @param {String} workerId - The ID of the worker
 * @returns {Object} - Updated worker performance metrics
 */
export const updateWorkerPerformanceScore = async (workerId) => {
  try {
    // Get all completed requests for this worker
    const completedRequests = await MaintenanceRequest.find({
      assignedTo: workerId,
      status: "Completed",
      rating: { $exists: true, $ne: null }, // Only consider rated requests
    })

    if (completedRequests.length === 0) {
      return { success: false, message: "No rated completed tasks found" }
    }

    // Calculate average rating
    const totalRating = completedRequests.reduce((sum, req) => sum + (req.rating || 0), 0)
    const averageRating = totalRating / completedRequests.length

    // Calculate average resolution time
    const requestsWithTime = completedRequests.filter((req) => req.resolutionTime)
    let averageResolutionTime = 0

    if (requestsWithTime.length > 0) {
      const totalTime = requestsWithTime.reduce((sum, req) => sum + req.resolutionTime, 0)
      averageResolutionTime = totalTime / requestsWithTime.length
    }

    // Calculate speed score (lower time is better)
    // Normalize to a 0-5 scale where 5 is fastest
    let speedScore = 5
    if (averageResolutionTime > 0) {
      // Assuming 48 hours (2 days) is the baseline for a score of 2.5
      speedScore = Math.max(0, Math.min(5, 5 - averageResolutionTime / 24))
    }

    // Calculate overall performance score
    // 60% based on rating, 40% based on speed
    const performanceScore = averageRating * 0.6 + speedScore * 0.4

    // Update worker record
    const updatedWorker = await WorkerModel.findByIdAndUpdate(
      workerId,
      {
        performanceScore,
        averageRating,
        averageResolutionTime,
        completedTasks: completedRequests.length,
      },
      { new: true },
    )

    if (!updatedWorker) {
      return { success: false, message: "Worker not found" }
    }

    return {
      success: true,
      worker: {
        id: updatedWorker._id,
        name: updatedWorker.name,
        role: updatedWorker.role,
        performanceScore,
        averageRating,
        averageResolutionTime,
        completedTasks: completedRequests.length,
      },
    }
  } catch (error) {
    console.error("Error updating worker performance:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Rate a completed maintenance request
 * @param {String} requestId - The ID of the request
 * @param {Number} rating - Rating from 1-5
 * @returns {Object} - The updated request and worker performance
 */
export const rateMaintenanceRequest = async (requestId, rating) => {
  try {
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, message: "Rating must be between 1 and 5" }
    }

    // Find the request
    const request = await MaintenanceRequest.findById(requestId)

    if (!request) {
      return { success: false, message: "Request not found" }
    }

    if (request.status !== "Completed") {
      return { success: false, message: "Only completed requests can be rated" }
    }

    if (!request.assignedTo) {
      return { success: false, message: "This request was not assigned to any worker" }
    }

    // Calculate resolution time if not already set
    if (!request.resolutionTime && request.completedAt && request.assignedAt) {
      const assignedTime = new Date(request.assignedAt).getTime()
      const completedTime = new Date(request.completedAt).getTime()
      request.resolutionTime = (completedTime - assignedTime) / (1000 * 60 * 60) // hours
    }

    // Update the request with the rating
    request.rating = rating
    await request.save()

    // Update worker performance score
    const performanceResult = await updateWorkerPerformanceScore(request.assignedTo)

    return {
      success: true,
      request,
      workerPerformance: performanceResult.success ? performanceResult.worker : null,
    }
  } catch (error) {
    console.error("Error rating maintenance request:", error)
    return { success: false, message: error.message }
  }
}
