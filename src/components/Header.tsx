"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../assets/cu_logo.jpg"

interface User {
  name: string
  role?: string
  userType?: string
  regNumber?: string
}

const Header = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")

    // Redirect based on user type
    if (user?.userType === "worker") {
      navigate("/worker")
    } else if (user?.userType === "admin") {
      navigate("/admin")
    } else {
      navigate("/login")
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <img src={Logo || "/placeholder.svg"} alt="Logo" className="h-10 w-auto" />
            <span className="ml-3 text-xl font-semibold hidden sm:inline">Dormitory Maintenance System</span>
            <span className="ml-3 text-lg font-semibold sm:hidden">DMS</span>
          </div>

          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-full">{user.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-full">
                  {user.role || user.userType || (user.regNumber ? "Student" : "")}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-black text-white px-3 sm:px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
