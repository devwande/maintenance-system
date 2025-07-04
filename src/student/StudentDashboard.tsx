"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { PlusIcon, X, Star } from "lucide-react";
import Header from "./components/header";
import NotificationCenter from "./components/NotificationCenter";
import axios from "axios";

interface FormData {
  title: string;
  category: string;
  hall: string;
  roomNumber: string;
  description: string;
  priority: string;
  image: File | null;
}

interface MaintenanceRequest {
  _id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  imageData?: string;
  imageContentType?: string;
  workerFeedback?: string;
  rating?: number;
}

const StudentDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    hall: "",
    roomNumber: "",
    description: "",
    priority: "Medium",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [studentRegNumber, setStudentRegNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRequestForRating, setSelectedRequestForRating] =
    useState<MaintenanceRequest | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  useEffect(() => {
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
      const response = await axios.get(
        `http://localhost:3001/api/requests/student/${regNumber}`
      );
      const data = response.data;

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
      hall: "",
      roomNumber: "",
      description: "",
      priority: "Medium",
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
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category);
      formDataToSend.append(
        "location",
        `${formData.hall} - Room ${formData.roomNumber}`
      );
      formDataToSend.append("description", formData.description);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("studentRegNumber", studentRegNumber);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await axios.post(`http://localhost:3001/api/requests`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsModalOpen(false);
      resetForm();
      fetchRequests(studentRegNumber);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRatingModal = (request: MaintenanceRequest) => {
    setSelectedRequestForRating(request);
    setCurrentRating(request.rating || 0);
    setRatingModalOpen(true);
  };

  const handleRatingChange = (rating: number) => {
    setCurrentRating(rating);
  };

  const submitRating = async () => {
    if (!selectedRequestForRating || currentRating === 0) return;

    setIsRatingSubmitting(true);

    try {
      const response = await axios.post(
        `http://localhost:3001/api/requests/${selectedRequestForRating._id}/rate`,
        {
          rating: currentRating,
        }
      );

      if (response.data.success) {
        setRequests(
          requests.map((req) =>
            req._id === selectedRequestForRating._id
              ? { ...req, rating: currentRating }
              : req
          )
        );

        setRatingModalOpen(false);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <>
      <main className="mx-auto md:max-w-full xl:max-w-[1440px] space-y-10">
        <Header />

        {/* Notification Center */}
        {/* <div className="relative ml-auto mr-4 mt-4 flex justify-end">
          <NotificationCenter requests={requests} />
        </div> */}

        <section className="px-4">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold">
                Submit a Maintenance Request
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
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
                  <option value="Carpenter">Carpenter</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="Low">
                    Low - Can be fixed when convenient
                  </option>
                  <option value="Medium">Medium - Should be fixed soon</option>
                  <option value="High">High - Needs prompt attention</option>
                  <option value="Critical">
                    Critical - Urgent safety or security issue
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Please select the appropriate priority level for your issue.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hall
                </label>
                <select
                  name="hall"
                  value={formData.hall}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select your hall</option>
                  <option value="Peter Hall">Peter Hall</option>
                  <option value="Paul Hall">Paul Hall</option>
                  <option value="John Hall">John Hall</option>
                  <option value="Joseph Hall">Joseph Hall</option>
                  <option value="Daniel Hall">Daniel Hall</option>
                  <option value="Esther Hall">Esther Hall</option>
                  <option value="Mary Hall">Mary Hall</option>
                  <option value="Deborah Hall">Deborah Hall</option>
                  <option value="Lydia Hall">Lydia Hall</option>
                  <option value="Dorcas Hall">Dorcas Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 101, A23, etc."
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

      <section className="mx-auto md:max-w-full xl:max-w-[1440px] px-4 mt-8">
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
              <div
                key={request._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{request.title}</h3>
                    <p className="text-sm text-gray-600">
                      {request.category} • {request.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                        request.priority || "Medium"
                      )}`}
                    >
                      {request.priority || "Medium"}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
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
                <p className="mt-2 text-sm">{request.description}</p>
                {request.imageData && (
                  <div className="mt-2">
                    <img
                      src={`http://localhost:3001/api/requests/image/${request._id}`}
                      alt="Request"
                      className="max-h-40 w-auto rounded-md object-cover shadow-sm border border-gray-200"
                      onError={(e) => {
                        console.error("Image failed to load:", request._id);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                {request.workerFeedback && (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium">Worker feedback:</p>
                    <p className="text-sm">{request.workerFeedback}</p>
                  </div>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Submitted on{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>

                  {request.status === "Completed" && (
                    <div>
                      {request.rating ? (
                        <div className="flex items-center">
                          <p className="text-sm mr-2">Your rating:</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={
                                  star <= (request.rating || 0)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRatingModal(request)}
                          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100"
                        >
                          Rate this service
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rating Modal */}
      {ratingModalOpen && selectedRequestForRating && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Rate this service</h2>
            <p className="mb-4">
              How would you rate the maintenance service for "
              {selectedRequestForRating.title}"?
            </p>

            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-1"
                >
                  <Star
                    size={32}
                    className={
                      star <= currentRating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={currentRating === 0 || isRatingSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isRatingSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;
