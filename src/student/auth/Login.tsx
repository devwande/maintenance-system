"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Logo from "../../assets/cu_logo.jpg";
import ForgotPassword from "../../components/ForgotPassword";

type LoginFormValues = {
  regNumber: string;
  password: string;
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: LoginFormValues = {
      regNumber: formData.get("regNumber") as string,
      password: formData.get("password") as string,
    };

    try {
      const response = await axios.post(
        `https://maintenance-system-backend-production.up.railway.app/login`,
        values
      );

      if (
        response.data.status === "success" ||
        response.data.message === "Login successful"
      ) {
        const userData = response.data.user || response.data.data?.user;
        toast.success("Login successful");
        localStorage.setItem("user", JSON.stringify(userData));

        navigate("/studentdashboard", { replace: true });
        window.location.reload();
      } else {
        toast.error("Unexpected response format");
        console.error("Unexpected response:", response.data);
      }
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response) {
        switch (error.response.status) {
          case 400:
            toast.error("Registration number and password are required");
            break;
          case 401:
            toast.error("Incorrect password");
            break;
          case 404:
            toast.error("No account found with this registration number");
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

  if (showForgotPassword) {
    return (
      <ForgotPassword
        userType="student"
        onBack={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img
            src={Logo || "/placeholder.svg"}
            alt="Logo"
            className="max-w-[100px]"
          />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Student Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="regNumber" className="text-sm font-medium">
              Registration Number:
            </label>
            <input
              id="regNumber"
              name="regNumber"
              placeholder="e.g. 2100599"
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

          <div className="flex justify-between items-center text-sm">
            <p>
              Don't have an account?{" "}
              <a href="/register" className="underline hover:text-purple-500">
                Sign Up
              </a>
            </p>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Forgot Password?
            </button>
          </div>

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

export default Login;
