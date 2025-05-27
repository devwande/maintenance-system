"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import Header from "@/components/Header"
import RequestImage from "@/components/RequestImage"
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
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"

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
  imageData?: string
  imageContentType?: string
  imageUrl?: string
  workerFeedback?: string
  assignedTo?: {
    _id: string
    name: string
    role: string
  }
  rating?: number
}

interface WorkerStats {
  _id: string
  name: string
  role: string
  performanceScore: number
  averageRating: number
  averageResolutionTime: number
  workload: {
    pending: number
    inProgress: number
    completed: number
    total: number
  }
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

interface Worker {
  _id: string
  name: string
  role: string
  performanceScore?: number
  averageRating?: number
  averageResolutionTime?: number
  workload?: {
    pending: number
    inProgress: number
    completed: number
    total: number
    active: number
  }
}

interface AlertState {
  open: boolean
  message: string
  severity: "success" | "error" | "warning" | "info"
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
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
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>("")
  const [viewMode, setViewMode] = useState<"standard" | "prioritized">("standard")
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards")
  const [page, setPage] = useState<number>(1)
  const [rowsPerPage] = useState<number>(10)
  const [alert, setAlert] = useState<AlertState>({ open: false, message: "", severity: "success" })

  const navigate = useNavigate()

  const categories = ["Electrical", "Plumbing", "Carpenter", "HVAC", "Furniture", "Other"]
  const statuses = ["Pending", "In Progress", "Completed", "Cancelled"]
  const priorities = ["Critical", "High", "Medium", "Low"]

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
        fetchWorkerStats()
        fetchWorkers()
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
  }, [requests, searchTerm, statusFilter, categoryFilter, priorityFilter])

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

  const fetchPrioritizedRequests = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let url = "http://localhost:3001/api/admin/prioritized-requests"
      const params = new URLSearchParams()

      if (statusFilter) params.append("status", statusFilter)
      if (categoryFilter) params.append("category", categoryFilter)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await axios.get(url)
      setRequests(response.data)
      setFilteredRequests(response.data)
    } catch (error) {
      console.error("Error fetching prioritized requests:", error)
      setError("Failed to load prioritized maintenance requests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkerStats = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/admin/worker-statistics")
      setWorkerStats(response.data)
    } catch (error) {
      console.error("Error fetching worker statistics:", error)
    }
  }

  const fetchWorkers = async (): Promise<void> => {
    try {
      const response = await fetch("http://localhost:3001/api/admin/worker-statistics")
      const data: Worker[] = await response.json()
      setWorkers(data)
    } catch (error) {
      console.error("Error fetching workers:", error)
      showAlert("Failed to fetch workers", "error")
    }
  }

  const applyFilters = () => {
    let filtered = [...requests]

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.studentRegNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((request) => request.category === categoryFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter((request) => request.priority === priorityFilter)
    }

    setFilteredRequests(filtered)
    setPage(1)
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

  const handleViewModeChange = (mode: "standard" | "prioritized") => {
    setViewMode(mode)
    if (mode === "prioritized") {
      fetchPrioritizedRequests()
    } else {
      fetchRequests()
    }
  }

  const openRequestModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
    setSelectedWorker(request.assignedTo ? request.assignedTo._id : "")
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
        if (viewMode === "prioritized") {
          fetchPrioritizedRequests()
        } else {
          fetchRequests()
        }
        fetchWorkerStats()
      }
    } catch (error) {
      console.error("Error reassigning request:", error)
      toast.error("Failed to reassign request")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedRequest) return

    setIsAssigning(true)

    try {
      const response = await axios.patch(`http://localhost:3001/api/admin/priority/${selectedRequest._id}`, {
        priority: newPriority,
      })

      if (response.status === 200) {
        toast.success(`Priority updated to ${newPriority}`)
        setIsModalOpen(false)
        if (viewMode === "prioritized") {
          fetchPrioritizedRequests()
        } else {
          fetchRequests()
        }
      }
    } catch (error) {
      console.error("Error updating priority:", error)
      toast.error("Failed to update priority")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAssignWorker = async (): Promise<void> => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`http://localhost:3001/api/requests/${selectedRequest._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: selectedWorker,
          assignedAt: new Date(),
          status: selectedWorker ? "In Progress" : "Pending",
        }),
      })

      if (response.ok) {
        showAlert("Worker assigned successfully", "success")
        if (viewMode === "prioritized") {
          fetchPrioritizedRequests()
        } else {
          fetchRequests()
        }
        setIsModalOpen(false)
      } else {
        showAlert("Failed to assign worker", "error")
      }
    } catch (error) {
      console.error("Error assigning worker:", error)
      showAlert("Error assigning worker", "error")
    }
  }

  const showAlert = (message: string, severity: AlertState["severity"] = "success"): void => {
    setAlert({ open: true, message, severity })
    setTimeout(() => setAlert({ ...alert, open: false }), 3000)
  }

  const prepareExportData = () => {
    return filteredRequests.map((request) => ({
      Title: request.title,
      Category: request.category,
      Location: request.location,
      Description: request.description,
      Status: request.status,
      Priority: request.priority,
      Student: request.studentRegNumber,
      "Assigned To": request.assignedTo?.name || "Not assigned",
      "Submitted On": new Date(request.createdAt).toLocaleDateString(),
      Rating: request.rating || "Not rated",
      Feedback: request.workerFeedback || "N/A",
    }))
  }

  const exportToExcel = (): void => {
    const excelData = prepareExportData()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests")
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })
    saveAs(data, "requests.xlsx")
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const indexOfLastRequest = page * rowsPerPage
  const indexOfFirstRequest = indexOfLastRequest - rowsPerPage
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest)

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all maintenance requests</p>
        </div>

        {/* Alert */}
        {alert.open && (
          <div
            className={`mb-4 p-4 rounded-md ${
              alert.severity === "success"
                ? "bg-green-50 text-green-800"
                : alert.severity === "error"
                  ? "bg-red-50 text-red-800"
                  : alert.severity === "warning"
                    ? "bg-yellow-50 text-yellow-800"
                    : "bg-blue-50 text-blue-800"
            }`}
          >
            {alert.message}
          </div>
        )}

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

        {/* Worker Performance Stats */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="font-bold text-xl mb-4">Worker Performance</h3>

          {workerStats.length === 0 ? (
            <p className="text-gray-500">No worker performance data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Resolution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Workload
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workerStats.map((worker) => (
                    <tr key={worker._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{worker.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${Math.min(worker.performanceScore * 20, 100)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-700">{worker.performanceScore.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {worker.averageRating ? worker.averageRating.toFixed(1) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {worker.averageResolutionTime ? `${worker.averageResolutionTime.toFixed(1)} hrs` : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{worker.workload.inProgress} in progress</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 justify-between">
            <div className="flex flex-wrap gap-4">
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
                <label htmlFor="displayMode" className="block text-sm font-medium mb-1">
                  Display Mode:
                </label>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setDisplayMode("cards")}
                    className={`px-4 py-1.5 ${
                      displayMode === "cards" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setDisplayMode("table")}
                    className={`px-4 py-1.5 ${
                      displayMode === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <CSVLink
                data={prepareExportData()}
                filename={"maintenance-requests.csv"}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-flex items-center gap-2"
              >
                Export to CSV
              </CSVLink>
              <button onClick={exportToExcel} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Export to Excel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests Display */}
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
        ) : displayMode === "table" ? (
          /* Table View */
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}
                        >
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.studentRegNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.assignedTo ? (
                          <div className="text-sm text-gray-900">
                            {request.assignedTo.name} ({request.assignedTo.role})
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => openRequestModal(request)} className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(filteredRequests.length / rowsPerPage), page + 1))}
                  disabled={page >= Math.ceil(filteredRequests.length / rowsPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstRequest + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(indexOfLastRequest, filteredRequests.length)}</span> of{" "}
                    <span className="font-medium">{filteredRequests.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                      {page}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(Math.ceil(filteredRequests.length / rowsPerPage), page + 1))}
                      disabled={page >= Math.ceil(filteredRequests.length / rowsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Card View */
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
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(request.priority || "Medium")}`}
                    >
                      {request.priority || "Medium"}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <p className="mt-2">{request.description}</p>
                {request.assignedTo && (
                  <div className="mt-2 bg-blue-50 p-2 rounded">
                    <p className="text-sm font-medium">Assigned to:</p>
                    <p className="text-sm">
                      {request.assignedTo.name} ({request.assignedTo.role})
                    </p>
                  </div>
                )}
                {request.workerFeedback && (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium">Worker feedback:</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedRequest.title}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedRequest.status)}`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getPriorityColor(selectedRequest.priority || "Medium")}`}
                    >
                      {selectedRequest.priority || "Medium"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.location}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Registration Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.studentRegNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                </div>

                {/* Image Display */}
                {(selectedRequest.imageData || selectedRequest.imageUrl) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    {selectedRequest.imageData ? (
                      <RequestImage requestId={selectedRequest._id} requestTitle={selectedRequest.title} />
                    ) : selectedRequest.imageUrl ? (
                      <img
                        src={`http://localhost:3001${selectedRequest.imageUrl}`}
                        alt="Request"
                        className="max-h-60 rounded-md"
                      />
                    ) : null}
                  </div>
                )}

                {selectedRequest.workerFeedback && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Worker Feedback</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedRequest.workerFeedback}
                    </p>
                  </div>
                )}

                {selectedRequest.rating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.rating}/5 stars</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Update Priority</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {priorities.map((priority) => (
                      <button
                        key={priority}
                        onClick={() => handleUpdatePriority(priority)}
                        disabled={isAssigning || selectedRequest.priority === priority}
                        className={`px-3 py-1.5 rounded-md ${
                          selectedRequest.priority === priority
                            ? "bg-gray-200 text-gray-700"
                            : `${getPriorityColor(priority)} hover:opacity-80`
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reassign Category</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleAssignCategory(category)}
                        disabled={isAssigning || selectedRequest.category === category}
                        className={`px-3 py-1.5 rounded-md ${
                          selectedRequest.category === category
                            ? "bg-gray-200 text-gray-700"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign Worker</label>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a worker</option>
                    {workers.map((worker) => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} ({worker.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleAssignWorker}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Assign Worker
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
