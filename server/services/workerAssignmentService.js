import WorkerModel from "../models/Worker.js"
import MaintenanceRequest from "../models/MaintenanceRequest.js"

// Map worker roles to request categories
const roleToCategoryMap = {
  Electrician: "Electrical",
  Plumber: "Plumbing",
  Carpenter: "Carpenter",
  Other: "Other",
}

// Map request categories to worker roles
const categoryToRoleMap = {
  Electrical: "Electrician",
  Plumbing: "Plumber",
  Carpenter: "Carpenter",
  Other: "Other",
}

/**
 * Smart Worker Auto-Assignment Algorithm
 * Assigns the most suitable and least busy worker to a maintenance request
 */
export const assignWorkerToRequest = async (requestId, changeStatus = true) => {
  try {
    const request = await MaintenanceRequest.findById(requestId)

    if (!request) {
      throw new Error("Request not found")
    }

    if (request.assignedTo) {
      console.log("Request already assigned to:", request.assignedTo)
      return { success: false, message: "Request already assigned" }
    }

    // Get the worker role needed for this category
    const requiredRole = categoryToRoleMap[request.category] || request.category

    console.log(`Looking for workers with role: ${requiredRole} for category: ${request.category}`)

    // Find all workers with the required role
    const eligibleWorkers = await WorkerModel.find({ role: requiredRole })

    console.log(
      `Found ${eligibleWorkers.length} eligible workers:`,
      eligibleWorkers.map((w) => ({ id: w._id, name: w.name, role: w.role })),
    )

    if (eligibleWorkers.length === 0) {
      console.log(`No workers available with role: ${requiredRole}`)
      return {
        success: false,
        message: `No workers available with role: ${requiredRole}`,
      }
    }

    // Get the current workload for each eligible worker
    const workerWorkloads = await Promise.all(
      eligibleWorkers.map(async (worker) => {
        // Count all active requests (Pending + In Progress)
        const activeRequestsCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: { $in: ["Pending", "In Progress"] },
        })

        // Count completed requests for performance calculation
        const completedCount = await MaintenanceRequest.countDocuments({
          assignedTo: worker._id,
          status: "Completed",
        })

        console.log(
          `Worker ${worker.name} (${worker._id}): ${activeRequestsCount} active requests, ${completedCount} completed`,
        )

        return {
          workerId: worker._id,
          name: worker.name,
          role: worker.role,
          activeRequestsCount,
          completedCount,
          performanceScore: worker.performanceScore || 0,
          averageRating: worker.averageRating || 0,
        }
      }),
    )

    console.log("Worker workloads:", workerWorkloads)

    // Sort workers by workload (ascending), then by performance score (descending)
    workerWorkloads.sort((a, b) => {
      // First priority: least active requests
      if (a.activeRequestsCount !== b.activeRequestsCount) {
        return a.activeRequestsCount - b.activeRequestsCount
      }

      // Second priority: higher performance score
      if (a.performanceScore !== b.performanceScore) {
        return b.performanceScore - a.performanceScore
      }

      // Third priority: higher average rating
      return b.averageRating - a.averageRating
    })

    console.log("Sorted worker workloads:", workerWorkloads)

    // Assign to the worker with the least workload and best performance
    const selectedWorker = workerWorkloads[0]

    console.log(
      `Selected worker: ${selectedWorker.name} (${selectedWorker.workerId}) with ${selectedWorker.activeRequestsCount} active requests`,
    )

    // Update the request with the assigned worker
    request.assignedTo = selectedWorker.workerId
    request.assignedAt = new Date()

    // Only change status if explicitly requested (for manual assignment)
    if (changeStatus) {
      request.status = "In Progress"
      console.log("Status changed to In Progress")
    } else {
      console.log("Status kept as Pending")
    }

    await request.save()

    console.log(`✅ Request ${requestId} successfully assigned to ${selectedWorker.name}`)

    return {
      success: true,
      message: `Request assigned to ${selectedWorker.name}`,
      workerId: selectedWorker.workerId,
      workerName: selectedWorker.name,
    }
  } catch (error) {
    console.error("❌ Error in worker assignment:", error)
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
            active: pendingCount + inProgressCount, // New field for active requests
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

/**
 * Manual assignment function for admin use
 */
export const manuallyAssignWorker = async (requestId, workerId) => {
  try {
    const request = await MaintenanceRequest.findById(requestId)
    const worker = await WorkerModel.findById(workerId)

    if (!request) {
      throw new Error("Request not found")
    }

    if (!worker) {
      throw new Error("Worker not found")
    }

    // Check if worker's role matches request category
    const requiredRole = categoryToRoleMap[request.category] || request.category
    if (worker.role !== requiredRole) {
      console.log(`Warning: Worker role (${worker.role}) doesn't match required role (${requiredRole})`)
    }

    request.assignedTo = workerId
    request.assignedAt = new Date()

    // For manual assignment, change status to In Progress
    if (request.status === "Pending") {
      request.status = "In Progress"
    }

    await request.save()

    console.log(`✅ Request ${requestId} manually assigned to ${worker.name}`)

    return {
      success: true,
      message: `Request manually assigned to ${worker.name}`,
      workerId: workerId,
      workerName: worker.name,
    }
  } catch (error) {
    console.error("❌ Error in manual assignment:", error)
    return { success: false, message: error.message }
  }
}
