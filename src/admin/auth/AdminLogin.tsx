import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Logo from "../../assets/cu_logo.jpg";

type LoginFormValues = {
  name: string;
  password: string;
};

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const values: LoginFormValues = {
      name: formData.get("name") as string,
      password: formData.get("password") as string,
    };
  
    try {
      const response = await axios.post(`http://localhost:3001/admin/login`, values);
      
      if (response.data.status === "success") {
        const userData = response.data.data.user;
        toast.success("Login successful");
        localStorage.setItem("user", JSON.stringify(userData));
        
        navigate("/admindashboard", { replace: true });
      } else {
        toast.error("Unexpected response format");
        console.error("Unexpected response:", response.data);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            toast.error("All fields are required");
            break;
          case 401:
            toast.error("Incorrect credentials");
            break;
          default:
            toast.error("Login failed. Please try again.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo || "/placeholder.svg"} alt="Logo" className="max-w-[100px]" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Hall Officer (Admin) Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Staff Name:
            </label>
            <input
              id="name"
              name="name"
              placeholder="Enter staff name"
              required
              className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <p className="text-sm text-gray-500">
            Default credentials: admin / admin123
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;