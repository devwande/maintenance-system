import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../../assets/cu_logo.jpg";
import toast from "react-hot-toast";

const Login = () => {
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    axios
      .post("http://localhost:3001/login", { regNumber, password })
      .then((res) => {
        if (res.data === "success") {
          toast.success("Login successful");
          navigate("/studentdashboard");
        } else if (res.data === "the password is incorrect") {
          toast.error("Incorrect password");
        } else if (res.data === "No record existed") {
          toast.error("No account found");
        }
      })
      .catch((err) => console.log(err));
    setIsLoading(true);
  };

  return (
    
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="max-w-[100px]" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Student Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="gap-3">
            <label
              htmlFor="loginRegNumber"
              className="text-sm font-medium mb-10"
            >
              Registration Number:
            </label>
            <input
              id="loginRegNumber"
              placeholder="e.g. 2100599"
              onChange={(e) => setRegNumber(e.target.value)}
              required
              className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="loginPassword" className="text-sm font-medium">
              Password:
            </label>
            <input
              id="loginPassword"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <p>
            Don't have an account? <a href="/register">Sign Up</a>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}

          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
