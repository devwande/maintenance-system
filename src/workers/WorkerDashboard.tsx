"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import Header from "@/components/Header"

interface MaintenanceRequest {
  _id: string
  title: string
  category: string
  location: string
  description: string
  status: string
  priority: string
  priorityScore?: number
  createdAt: string
  studentRegNumber: string
  imageUrl?: string
  workerFeedback?: string
  rating?: number
  assignedAt?: string
}

const WorkerDashboard = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workerRole, setWorkerRole] = useState<string>("")
  const [workerId, setWorkerId] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [feedback, setFeedback] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [viewMode, setViewMode] = useState<"standard" | "prioritized">("standard")
  const [performanceStats, setPerformanceStats] = useState({
    performanceScore: 0,
    averageRating: 0,
    averageResolutionTime: 0,
    completedTasks: 0,
  })

  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        if (parsedData.userType !== "worker") {
          toast.error("Unauthorized access")
          navigate("/")
          return
        }
        setWorkerRole(parsedData.role)
        setWorkerId(parsedData.id)
        fetchRequests(parsedData.role)
        fetchWorkerStats(parsedData.id)
      } catch (error) {
        console.error("Error parsing user data:", error)
        setError("Could not load user data. Please log in again.")
        navigate("/worker")
      }
    } else {
      setError("User not logged in")
      navigate("/worker")
    }
  }, [navigate])

  const fetchRequests = async (role: string, status = "") => {
    setIsLoading(true)
    setError(null)

    try {
      // Map worker roles to request categories
      const roleToCategory: Record<string, string> = {
        Electrician: "Electrical",
        Plumber: "Plumbing",
        Carpenter: "Carpenter",
        Other: "Other",
      }

      // Use the mapped category or the original role if no mapping exists
      const category = roleToCategory[role as keyof typeof roleToCategory] || role

      console.log(`Fetching requests for category: ${category}`)
      const url = `http://localhost:3001/api/worker/requests/${role}${status ? `?status=${status}` : ""}`

      const response = await axios.get(url)
      setRequests(response.data)
    } catch (error) {
      console.error("Error fetching requests:", error)
      setError("Failed to load maintenance requests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrioritizedRequests = async (role: string, status = "") => {
    setIsLoading(true)
    setError(null)

    try {
      // Map worker roles to request categories
      const roleToCategory: Record<string, string> = {
        Electrician: "Electrical",
        Plumber: "Plumbing",
        Carpenter: "Carpenter",
        Other: "Other",
      }

      // Use the mapped category or the original role if no mapping exists
      const category = roleToCategory[role as keyof typeof roleToCategory] || role

      let url = "http://localhost:3001/api/admin/prioritized-requests"
      const params = new URLSearchParams()

      params.append("category", category)
      if (status) params.append("status", status)

      url += `?${params.toString()}`

      const response = await axios.get(url)
      setRequests(response.data)
    } catch (error) {
      console.error("Error fetching prioritized requests:", error)
      setError("Failed to load prioritized maintenance requests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkerStats = async (workerId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/admin/worker-statistics`)
      const allWorkers = response.data

      const currentWorker = allWorkers.find((worker: any) => worker._id === workerId)

      if (currentWorker) {
        setPerformanceStats({
          performanceScore: currentWorker.performanceScore || 0,
          averageRating: currentWorker.averageRating || 0,
          averageResolutionTime: currentWorker.averageResolutionTime || 0,
          completedTasks: currentWorker.workload?.completed || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching worker stats:", error)
    }
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value
    setStatusFilter(status)

    if (viewMode === "prioritized") {
      fetchPrioritizedRequests(workerRole, status)
    } else {
      fetchRequests(workerRole, status)
    }
  }

  const handleViewModeChange = (mode: "standard" | "prioritized") => {
    setViewMode(mode)
    if (mode === "prioritized") {
      fetchPrioritizedRequests(workerRole, statusFilter)
    } else {
      fetchRequests(workerRole, statusFilter)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRequest) return

    setIsUpdating(true)

    try {
      // If marking as completed, set the completedAt date
      const payload: any = {
        status: newStatus,
        workerFeedback: feedback,
      }

      const response = await axios.patch(`http://localhost:3001/api/requests/${selectedRequest._id}`, payload)

      if (response.status === 200) {
        toast.success(`Request marked as ${newStatus}`)
        setIsModalOpen(false)
        setFeedback("")

        if (viewMode === "prioritized") {
          fetchPrioritizedRequests(workerRole, statusFilter)
        } else {
          fetchRequests(workerRole, statusFilter)
        }

        // Refresh worker stats if a task was completed
        if (newStatus === "Completed") {
          fetchWorkerStats(workerId)
        }
      }
    } catch (error) {
      console.error("Error updating request:", error)
      toast.error("Failed to update request status")
    } finally {
      setIsUpdating(false)
    }
  }

  const openRequestModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
    setFeedback(request.workerFeedback || "")
    setIsModalOpen(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-blue-100 text-blue-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Maintenance Worker Dashboard</h1>
          <p className="text-gray-600">Manage maintenance requests assigned to you</p>
        </div>

        {/* Worker Stats */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <h3 className="font-medium mb-4">Your Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm text-gray-500">Performance Score</h4>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(performanceStats.performanceScore * 20, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{performanceStats.performanceScore.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm text-gray-500">Average Rating</h4>
              <p className="text-xl font-medium">
                {performanceStats.averageRating ? performanceStats.averageRating.toFixed(1) : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm text-gray-500">Avg. Resolution Time</h4>
              <p className="text-xl font-medium">
                {performanceStats.averageResolutionTime
                  ? `${performanceStats.averageResolutionTime.toFixed(1)} hrs`
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm text-gray-500">Completed Tasks</h4>
              <p className="text-xl font-medium">{performanceStats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="viewMode" className="block text-sm font-medium mb-1">
                View Mode:
              </label>
              <div className="flex rounded-md overflow-hidden border border-gray-300">
                <button
                  onClick={() => handleViewModeChange("standard")}
                  className={`px-4 py-1.5 ${
                    viewMode === "standard" ? "bg-black text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => handleViewModeChange("prioritized")}
                  className={`px-4 py-1.5 ${
                    viewMode === "prioritized" ? "bg-black text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Prioritized
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium mb-1">
                Filter by status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusChange}
                className="border border-gray-300 rounded-md px-3 py-1.5"
              >
                <option value="">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-100 px-4 py-2 rounded-md">
            <span className="font-medium">Your Role:</span> {workerRole}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading maintenance requests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No maintenance requests found for your role.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div
                key={request._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openRequestModal(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{request.title}</h3>
                    <p className="text-sm text-gray-600">
                      {request.category} • {request.location} • Room: {request.studentRegNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(request.priority || "Medium")}`}
                    >
                      {request.priority || "Medium"}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        request.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : request.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
                <p className="mt-2">{request.description}</p>
                {request.workerFeedback && (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium">Your feedback:</p>
                    <p className="text-sm">{request.workerFeedback}</p>
                  </div>
                )}
                <div className="mt-2 flex justify-between">
                  <p className="text-xs text-gray-500">
                    Submitted on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  {viewMode === "prioritized" && request.priorityScore && (
                    <p className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Priority Score: {request.priorityScore.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Request Detail Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{selectedRequest.title}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p
                      className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${
                        selectedRequest.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : selectedRequest.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedRequest.status}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <p
                      className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${getPriorityColor(
                        selectedRequest.priority || "Medium",
                      )}`}
                    >
                      {selectedRequest.priority || "Medium"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{selectedRequest.category}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{selectedRequest.location}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p>{selectedRequest.description}</p>
                </div>

                {selectedRequest.imageUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Image</p>
                    <img
                      src={`http://localhost:3001${selectedRequest.imageUrl}`}
                      alt="Request"
                      className="mt-2 max-h-60 rounded-md"
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Feedback</p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
                    placeholder="Add your feedback or notes about this repair"
                  />
                </div>

                <div className="pt-4 border-t flex justify-end space-x-3">
                  {selectedRequest.status === "Pending" && (
                    <button
                      onClick={() => handleUpdateStatus("In Progress")}
                      disabled={isUpdating}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : "Mark as In Progress"}
                    </button>
                  )}

                  {(selectedRequest.status === "Pending" || selectedRequest.status === "In Progress") && (
                    <button
                      onClick={() => handleUpdateStatus("Completed")}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : "Mark as Completed"}
                    </button>
                  )}

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WorkerDashboard
