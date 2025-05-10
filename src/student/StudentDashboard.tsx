import { useEffect, useState } from "react";
import { PlusIcon, X } from 'lucide-react';
import Header from "./components/header";
import axios from "axios";

interface FormData {
  title: string;
  category: string;
  location: string;
  description: string;
  image: File | null;
}

interface MaintenanceRequest {
  _id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  status: string;
  createdAt: string;
}

const StudentDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    location: "",
    description: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [studentRegNumber, setStudentRegNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get student data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setStudentRegNumber(parsedData.regNumber);
        fetchRequests(parsedData.regNumber);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Could not load user data. Please log in again.");
      }
    } else {
      setError("User not logged in. Please log in to view your requests.");
      setIsLoading(false);
    }
  }, []);

  const fetchRequests = async (regNumber: string) => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await axios.get(`http://localhost:3001/api/requests/${regNumber}`);
      const data = response.data;
  
      // Make sure data is an array
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
  
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to load maintenance requests. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      location: "",
      description: "",
      image: null,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('studentRegNumber', studentRegNumber);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
  
      // For debugging - log the form data before sending
      console.log("Form submitted:", {
        title: formData.title,
        category: formData.category,
        location: formData.location,
        description: formData.description,
        hasImage: !!formData.image
      });
  
      // Submit to backend
      await axios.post(`http://localhost:3001/api/requests`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      // Small delay for better UX (optional)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Close modal and reset
      setIsModalOpen(false);
      resetForm();
      
      // Refresh requests list
      fetchRequests(studentRegNumber);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      // Optionally show error to user
      setError("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="mx-auto md:max-w-full xl:max-w-[1440px] space-y-10">
        <Header />

        <section className="px-4 md:px-24">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Student Maintenance Requests
              </h1>
              <p className="text-gray-400">
                View and manage your maintenance requests
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black flex items-center gap-3 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <PlusIcon size={18} />
              New Request
            </button>
          </div>
        </section>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold">
                Submit a Maintenance Request
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm(); // Reset form when closing modal
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Brief description of the issue"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please fill out this field.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Building and room number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                  placeholder="Please describe the issue in detail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200">
                    Choose File
                    <input
                      type="file"
                      name="image"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {formData.image ? formData.image.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="mr-2 bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        <section className="px-4 md:px-24 mt-8">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading your maintenance requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't submitted any maintenance requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{request.title}</h3>
                      <p className="text-sm text-gray-600">{request.category} • {request.location}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{request.description}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Submitted on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
    </>
  );
};

export default StudentDashboard;
