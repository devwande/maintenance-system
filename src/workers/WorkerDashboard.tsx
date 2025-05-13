import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "@/components/Header";

interface MaintenanceRequest {
  _id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  status: string;
  createdAt: string;
  studentRegNumber: string;
  imageUrl?: string;
  workerFeedback?: string;
}

const WorkerDashboard = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerRole, setWorkerRole] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.userType !== "worker") {
          toast.error("Unauthorized access");
          navigate("/");
          return;
        }
        setWorkerRole(parsedData.role);
        fetchRequests(parsedData.role);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Could not load user data. Please log in again.");
        navigate("/worker");
      }
    } else {
      setError("User not logged in");
      navigate("/worker");
    }
  }, [navigate]);

  // const fetchRequests = async (role: string, status: string = "") => {
  //   setIsLoading(true);
  //   setError(null);
  
  //   try {
  //     const url = `http://localhost:3001/api/worker/requests/${role}${status ? `?status=${status}` : ''}`;
  //     const response = await axios.get(url);
  //     setRequests(response.data);
  //   } catch (error) {
  //     console.error("Error fetching requests:", error);
  //     setError("Failed to load maintenance requests. Please try again later.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchRequests = async (role: string, status: string = "") => {
  setIsLoading(true);
  setError(null);

  try {
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    console.log(`Fetching requests for role: ${normalizedRole}`);
    const url = `http://localhost:3001/api/worker/requests/${normalizedRole}${status ? `?status=${status}` : ''}`;
    console.log(`Request URL: ${url}`);
    const response = await axios.get(url);
    console.log('Response data:', response.data);
    setRequests(response.data);
  } catch (error) {
    console.error("Error fetching requests:", error);
    setError("Failed to load maintenance requests. Please try again later.");
  } finally {
    setIsLoading(false);
  }
};

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    setStatusFilter(status);
    fetchRequests(workerRole, status);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRequest) return;
    
    setIsUpdating(true);
    
    try {
      const response = await axios.patch(`http://localhost:3001/api/requests/${selectedRequest._id}`, {
        status: newStatus,
        workerFeedback: feedback
      });
      
      if (response.status === 200) {
        toast.success(`Request marked as ${newStatus}`);
        setIsModalOpen(false);
        setFeedback("");
        fetchRequests(workerRole, statusFilter);
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request status");
    } finally {
      setIsUpdating(false);
    }
  };

  const openRequestModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setFeedback(request.workerFeedback || "");
    setIsModalOpen(true);
  };

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Maintenance Worker Dashboard</h1>
          <p className="text-gray-600">Manage maintenance requests assigned to you</p>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <label htmlFor="statusFilter" className="mr-2 font-medium">Filter by status:</label>
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
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="mt-2">{request.description}</p>
                {request.workerFeedback && (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium">Your feedback:</p>
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
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${
                    selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    selectedRequest.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedRequest.status}
                  </p>
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
                  {selectedRequest.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus('In Progress')}
                      disabled={isUpdating}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark as In Progress'}
                    </button>
                  )}
                  
                  {(selectedRequest.status === 'Pending' || selectedRequest.status === 'In Progress') && (
                    <button
                      onClick={() => handleUpdateStatus('Completed')}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark as Completed'}
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
  );
};

export default WorkerDashboard;