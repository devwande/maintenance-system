import { useState } from "react";
import { PlusIcon, X } from 'lucide-react';
import Header from "./components/header";

interface FormData {
  title: string;
  category: string;
  location: string;
  description: string;
  image: File | null;
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
      // Here you would normally send the data to your API
      console.log("Form submitted:", formData);
      
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal and reset form after successful submission
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle submission error (you could show an error message)
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
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
    </>
  );
};

export default StudentDashboard;
