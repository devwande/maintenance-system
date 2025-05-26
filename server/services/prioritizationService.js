import MaintenanceRequest from "../models/MaintenanceRequest.js"

/**
 * Calculate priority score for a maintenance request
 * @param {Object} request - The maintenance request object
 * @returns {Number} - The priority score
 */
export const calculatePriorityScore = (request) => {
  // Base priority weights
  const priorityWeights = {
    Critical: 100,
    High: 70,
    Medium: 40,
    Low: 10,
  }

  // Get base score from priority
  let score = priorityWeights[request.priority] || priorityWeights["Medium"]

  // Add age factor (older requests get higher priority)
  const ageInHours = (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60)
  const ageFactor = Math.min(ageInHours / 24, 10) // Cap at 10 days
  score += ageFactor * 5 // Add 5 points per day of age

  // Category weights (optional)
  const categoryWeights = {
    Electrical: 1.2, // Electrical issues might be more urgent
    Plumbing: 1.1,
    HVAC: 1.1,
    Carpenter: 0.9,
    Other: 0.8,
  }

  // Apply category weight
  const categoryWeight = categoryWeights[request.category] || 1
  score *= categoryWeight

  return score
}

/**
 * Get prioritized maintenance requests
 * @param {Object} filters - Filters to apply (status, category, etc.)
 * @returns {Array} - Sorted array of maintenance requests
 */
export const getPrioritizedRequests = async (filters = {}) => {
  try {
    // Get requests with the specified filters
    const requests = await MaintenanceRequest.find(filters).populate("assignedTo", "name role")

    // Calculate priority score for each request
    const scoredRequests = requests.map((request) => {
      const requestObj = request.toObject()
      requestObj.priorityScore = calculatePriorityScore(requestObj)
      return requestObj
    })

    // Sort by priority score (descending)
    scoredRequests.sort((a, b) => b.priorityScore - a.priorityScore)

    return scoredRequests
  } catch (error) {
    console.error("Error in prioritization service:", error)
    throw error
  }
}

/**
 * Update request priority
 * @param {String} requestId - The ID of the request to update
 * @param {String} priority - The new priority level
 * @returns {Object} - The updated request
 */
export const updateRequestPriority = async (requestId, priority) => {
  try {
    if (!["Low", "Medium", "High", "Critical"].includes(priority)) {
      throw new Error("Invalid priority level")
    }

    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(requestId, { priority }, { new: true })

    if (!updatedRequest) {
      throw new Error("Request not found")
    }

    return updatedRequest
  } catch (error) {
    console.error("Error updating request priority:", error)
    throw error
  }
}
