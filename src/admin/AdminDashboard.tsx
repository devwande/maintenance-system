"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import Header from "@/components/Header"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { CSVLink } from "react-csv"

interface MaintenanceRequest {
  _id: string
  title: string
  category: string
  location: string
  description: string
  status: string
  createdAt: string
  studentRegNumber: string
  imageUrl?: string
  workerFeedback?: string
}

interface DashboardStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  categories: {
    [key: string]: number
  }
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    categories: {},
  })

  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        if (parsedData.userType !== "admin") {
          toast.error("Unauthorized access")
          navigate("/")
          return
        }
        fetchRequests()
      } catch (error) {
        console.error("Error parsing user data:", error)
        setError("Could not load user data. Please log in again.")
        navigate("/admin")
      }
    } else {
      setError("User not logged in")
      navigate("/admin")
    }
  }, [navigate])

  useEffect(() => {
    if (requests.length > 0) {
      applyFilters()
      calculateStats()
    }
  }, [requests, statusFilter, categoryFilter])

  const fetchRequests = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get("http://localhost:3001/api/admin/requests")
      setRequests(response.data)
    } catch (error) {
      console.error("Error fetching requests:", error)
      setError("Failed to load maintenance requests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...requests]

    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((request) => request.category === categoryFilter)
    }

    setFilteredRequests(filtered)
  }

  const calculateStats = () => {
    const newStats: DashboardStats = {
      total: requests.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      categories: {},
    }

    requests.forEach((request) => {
      // Count by status
      if (request.status === "Pending") newStats.pending++
      else if (request.status === "In Progress") newStats.inProgress++
      else if (request.status === "Completed") newStats.completed++

      // Count by category
      if (!newStats.categories[request.category]) {
        newStats.categories[request.category] = 1
      } else {
        newStats.categories[request.category]++
      }
    })

    setStats(newStats)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
  }

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value)
  }

  const openRequestModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleAssignCategory = async (newCategory: string) => {
    if (!selectedRequest) return

    setIsAssigning(true)

    try {
      const response = await axios.patch(`http://localhost:3001/api/admin/assign/${selectedRequest._id}`, {
        category: newCategory,
      })

      if (response.status === 200) {
        toast.success(`Request reassigned to ${newCategory}`)
        setIsModalOpen(false)
        fetchRequests()
      }
    } catch (error) {
      console.error("Error reassigning request:", error)
      toast.error("Failed to reassign request")
    } finally {
      setIsAssigning(false)
    }
  }

  const prepareExportData = () => {
    return filteredRequests.map((request) => ({
      Title: request.title,
      Category: request.category,
      Location: request.location,
      Description: request.description,
      Status: request.status,
      Student: request.studentRegNumber,
      "Submitted On": new Date(request.createdAt).toLocaleDateString(),
      Feedback: request.workerFeedback || "N/A",
    }))
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all maintenance requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Requests</h3>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-yellow-500 text-sm">Pending</h3>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-blue-500 text-sm">In Progress</h3>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-green-500 text-sm">Completed</h3>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>

        {/* Category Stats */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <h3 className="font-medium mb-4">Requests by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.categories).map(([category, count]) => (
              <div key={category} className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">{category}</h4>
                <p className="text-xl font-medium">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="font-bold text-xl mb-4">Analytics Dashboard</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Request Status Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending", value: stats.pending, color: "#FBBF24" },
                      { name: "In Progress", value: stats.inProgress, color: "#3B82F6" },
                      { name: "Completed", value: stats.completed, color: "#10B981" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: "Pending", value: stats.pending, color: "#FBBF24" },
                      { name: "In Progress", value: stats.inProgress, color: "#3B82F6" },
                      { name: "Completed", value: stats.completed, color: "#10B981" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Requests by Category</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(stats.categories).map(([category, count]) => ({
                    category,
                    count,
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium mb-1">
                Filter by status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border border-gray-300 rounded-md px-3 py-1.5"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium mb-1">
                Filter by category:
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                className="border border-gray-300 rounded-md px-3 py-1.5"
              >
                <option value="">All Categories</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Carpenter">Carpenter</option>
                <option value="HVAC">HVAC</option>
                <option value="Furniture">Furniture</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="self-end">
            <CSVLink
              data={prepareExportData()}
              filename={"maintenance-requests.csv"}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export to CSV
            </CSVLink>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading maintenance requests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No maintenance requests found matching your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openRequestModal(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{request.title}</h3>
                    <p className="text-sm text-gray-600">
                      {request.category} • {request.location} • Student: {request.studentRegNumber}
                    </p>
                  </div>
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
                <p className="mt-2">{request.description}</p>
                {request.workerFeedback && (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium">Worker feedback:</p>
                    <p className="text-sm">{request.workerFeedback}</p>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Submitted on {new Date(request.createdAt).toLocaleDateString()}
                </p>
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
                <div>
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

                <div>
                  <p className="text-sm font-medium text-gray-500">Student</p>
                  <p>{selectedRequest.studentRegNumber}</p>
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

                {selectedRequest.workerFeedback && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Worker Feedback</p>
                    <p className="bg-gray-50 p-2 rounded mt-1">{selectedRequest.workerFeedback}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Reassign Category</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAssignCategory("Electrical")}
                      disabled={isAssigning || selectedRequest.category === "Electrical"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "Electrical"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Electrical
                    </button>
                    <button
                      onClick={() => handleAssignCategory("Plumbing")}
                      disabled={isAssigning || selectedRequest.category === "Plumbing"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "Plumbing"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Plumbing
                    </button>
                    <button
                      onClick={() => handleAssignCategory("Carpenter")}
                      disabled={isAssigning || selectedRequest.category === "Carpenter"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "Carpenter"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Carpenter
                    </button>
                    <button
                      onClick={() => handleAssignCategory("HVAC")}
                      disabled={isAssigning || selectedRequest.category === "HVAC"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "HVAC"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      HVAC
                    </button>
                    <button
                      onClick={() => handleAssignCategory("Furniture")}
                      disabled={isAssigning || selectedRequest.category === "Furniture"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "Furniture"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Furniture
                    </button>
                    <button
                      onClick={() => handleAssignCategory("Other")}
                      disabled={isAssigning || selectedRequest.category === "Other"}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedRequest.category === "Other"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Other
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
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

export default AdminDashboard
