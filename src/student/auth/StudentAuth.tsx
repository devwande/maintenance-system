import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../../assets/cu_logo.jpg"


const StudentAuth = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // simulate login delay
    setTimeout(() => {
      setIsLoading(false)
      navigate("/studentdashboard") 
    }, 1500)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // simulate register delay
    setTimeout(() => {
      setIsLoading(false)
      navigate("/studentdashboard") 
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Covenant University Logo" className="max-w-[100px]"/>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
          <p className="text-sm text-gray-500">
            Login or register to submit maintenance requests
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`py-2 rounded-lg font-medium transition-all ${
              isLogin
                ? "bg-black text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`py-2 rounded-lg font-medium transition-all ${
              !isLogin
                ? "bg-black text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="gap-3">
              <label htmlFor="loginRegNumber" className="text-sm font-medium mb-10">
                Registration Number
              </label>
              <input id="loginRegNumber" placeholder="e.g. 2100599" required className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
            </div>

            <div className="space-y-1">
              <label htmlFor="loginPassword" className="text-sm font-medium">
                Password
              </label>
              <input id="loginPassword" type="password" required className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name:
              </label>
              <input
                id="fullName"
                placeholder="Lucifer Morningstar"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="registerRegNumber" className="text-sm font-medium">
                Registration Number:
              </label>
              <input
                id="registerRegNumber"
                placeholder="e.g. 2100599"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email:
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="dormitory" className="text-sm font-medium">
                Hall and Room Number:
              </label>
              <input
                id="dormitory"
                placeholder="Building & Room Number"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="registerPassword" className="text-sm font-medium">
                Password:
              </label>
              <input
                id="registerPassword"
                type="password"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="registerConfirmPassword" className="text-sm font-medium">
                Confirm Password:
              </label>
              <input
                id="registerConfirmPassword"
                type="password"
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default StudentAuth;
