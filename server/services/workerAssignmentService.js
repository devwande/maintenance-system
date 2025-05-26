import WorkerModel from "../models/Worker.js"
import MaintenanceRequest from "../models/MaintenanceRequest.js"

// Map worker roles to request categories
const roleToCategoryMap = {
  Electrician: "Electrical",
  Plumber: "Plumbing",
  Carpenter: "Carpenter",
  HVAC: "HVAC",
  Other: "Other",
}

// Map request categories to worker roles
const categoryToRoleMap = {
  Electrical: "Electrician",
  Plumbing: "Plumber",
  Carpenter: "Carpenter",
  HVAC: "HVAC",
  Other: "Other",
}

/**
 * Smart Worker Auto-Assignment Algorithm
 * Assigns the most suitable and least busy worker to a maintenance request
 */
export const assignWorkerToRequest = async (requestId) => {
  try {
    const request = await MaintenanceRequest.findById(requestId)

    if (!request) {
      throw new Error("Request not found")
    }

    if (request.assignedTo) {
      return { success: false, message: "Request already assigned" }
    }

    // Get the worker role needed for this category
    const requiredRole = categoryToRoleMap[request.category] || request.category

    // Find all workers with the required role
    const eligibleWorkers = await WorkerModel.find({ role: requiredRole })

    if (eligibleWorkers.length === 0) {
      return {
        success: false,
        message: `No workers available with role: ${requiredRole}`,
      }
    }

    // Get the current workload for each eligible worker
    const workerWorkloads = await Promise.all(
      eligibleWorkers.map(async (worker) => {
        const inProgressCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: "In Progress",
        })

        return {
          workerId: worker._id,
          name: worker.name,
          inProgressCount,
          performanceScore: worker.performanceScore || 0,
        }
      }),
    )

    // Sort workers by workload (ascending) and then by performance score (descending)
    workerWorkloads.sort((a, b) => {
      // First compare by workload
      if (a.inProgressCount !== b.inProgressCount) {
        return a.inProgressCount - b.inProgressCount
      }
      // If workload is the same, compare by performance score
      return b.performanceScore - a.performanceScore
    })

    // Assign to the worker with the least workload
    const selectedWorker = workerWorkloads[0]

    // Update the request with the assigned worker
    request.assignedTo = selectedWorker.workerId
    request.assignedAt = new Date()
    request.status = "In Progress"
    await request.save()

    return {
      success: true,
      message: `Request assigned to ${selectedWorker.name}`,
      workerId: selectedWorker.workerId,
    }
  } catch (error) {
    console.error("Error in worker assignment:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Get worker statistics for admin dashboard
 */
export const getWorkerStatistics = async () => {
  try {
    const workers = await WorkerModel.find({}, "-password")

    const workerStats = await Promise.all(
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
          _id: worker._id,
          name: worker.name,
          role: worker.role,
          performanceScore: worker.performanceScore || 0,
          averageRating: worker.averageRating || 0,
          averageResolutionTime: worker.averageResolutionTime || 0,
          workload: {
            pending: pendingCount,
            inProgress: inProgressCount,
            completed: completedCount,
            total: pendingCount + inProgressCount + completedCount,
          },
        }
      }),
    )

    return workerStats
  } catch (error) {
    console.error("Error getting worker statistics:", error)
    throw error
  }
}
