"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"

interface MaintenanceRequest {
  _id: string
  title: string
  category: string
  location: string
  description: string
  status: string
  priority: string
  createdAt: string
  studentRegNumber: string
  imageUrl?: string
}

interface AvailableRequestsProps {
  workerRole: string
  workerId: string
  onRequestClaimed: () => void
}

const AvailableRequests = ({ workerRole, workerId, onRequestClaimed }: AvailableRequestsProps) => {
  const [availableRequests, setAvailableRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClaimingRequest, setIsClaimingRequest] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableRequests()
  }, [workerRole])

  const fetchAvailableRequests = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`http://localhost:3001/api/worker/available-requests/${workerRole}`)
      setAvailableRequests(response.data)
    } catch (error) {
      console.error("Error fetching available requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const claimRequest = async (requestId: string) => {
    setIsClaimingRequest(requestId)
    try {
      // Assign the request to this worker
      const response = await axios.patch(`http://localhost:3001/api/requests/${requestId}`, {
        assignedTo: workerId,
        assignedAt: new Date(),
        status: "In Progress",
      })

      if (response.status === 200) {
        toast.success("Request claimed successfully!")
        fetchAvailableRequests() // Refresh available requests
        onRequestClaimed() // Refresh assigned requests
      }
    } catch (error) {
      console.error("Error claiming request:", error)
      toast.error("Failed to claim request")
    } finally {
      setIsClaimingRequest(null)
    }
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

  if (isLoading) {
    return <div className="text-center py-8">Loading available requests...</div>
  }

  if (availableRequests.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No available requests in your category.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {availableRequests.map((request) => (
        <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg">{request.title}</h3>
              <p className="text-sm text-gray-600">
                {request.category} • {request.location} • Student: {request.studentRegNumber}
              </p>
              <p className="mt-2">{request.description}</p>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(request.priority || "Medium")}`}>
                {request.priority || "Medium"}
              </span>
              <button
                onClick={() => claimRequest(request._id)}
                disabled={isClaimingRequest === request._id}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isClaimingRequest === request._id ? "Claiming..." : "Claim Request"}
              </button>
            </div>
          </div>
          {request.imageUrl && (
            <div className="mt-2">
              <img
                src={`http://localhost:3001${request.imageUrl}`}
                alt="Request"
                className="max-h-40 w-auto rounded-md shadow-sm border border-gray-200 object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", request.imageUrl)
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}
          <div className="mt-2">
            <p className="text-xs text-gray-500">Submitted on {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AvailableRequests
