"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../../assets/cu_logo.jpg"
import { ChevronDown, ChevronUp, CircleUser, LogOut } from "lucide-react"
import NotificationCenter from "./NotificationCenter"

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

const Header = () => {
  const [studentData, setStudentData] = useState<{
    regNumber: string
    name: string
    email: string
    dormitory: string
  } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem("user")

    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        setStudentData(parsedData)
      } catch (error) {
        console.error("Error parsing user data:", error)
        navigate("/login")
      }
    } else {
      navigate("/login")
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".relative")) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/login")
  }

  if (!studentData) {
    return <div>Loading...</div>
  }

  return (
    <header className="w-full py-2 border-b border-gray-200 shadow-md bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          <img src={Logo || "/placeholder.svg"} alt="Logo" className="max-w-[50px]" />
          <h1 className="ml-2 text-center font-bold text-lg hidden sm:block">Maintenance System</h1>
        </div>

        <div className="relative">
          <button
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-300 rounded-md p-2 transition-all duration-300"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <CircleUser className="text-gray-700" />
            <span className="hidden sm:inline">{studentData.name.split(" ")[0]}</span>
            {isDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{studentData.name}</p>
                <p className="text-sm font-medium text-gray-900">{studentData.regNumber}</p>
                <p className="text-xs text-gray-500">{studentData.dormitory}</p>
              </div>

                      <div className="relative mr-auto flex justify-start">
                        <NotificationCenter requests={requests} />
                      </div>

              <div className="py-1 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="mr-2" size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
