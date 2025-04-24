import React, { useState } from "react";
import axios from "axios";
import Logo from "../../assets/cu_logo.jpg";
import { useNavigate } from "react-router";

const Register = () => {
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dormitory, setDormitory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("")


  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()


  const handleRegister= async (e: React.FormEvent) => {
    e.preventDefault()
    axios.post('http://localhost:3001/register', { name, regNumber, email, dormitory, password, confirmPassword })
      .then((response) => {console.log(response);
         navigate('/login')})
      .catch(err => console.log(err))
    setIsLoading(true)

  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="max-w-[100px]" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Student Register</h2>

    

        <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name:
              </label>
              <input
                id="name"
                placeholder="Jane Doe"
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="regNumber" className="text-sm font-medium">
                Registration Number:
              </label>
              <input
                id="regNumber"
                placeholder="e.g. 2100599"
                onChange={(e) => setRegNumber(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setDormitory(e.target.value)}
                placeholder="Building & Room Number"
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
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password:
              </label>
              <input
                id="confirmPassword"
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border border-gray-300 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <p>Already have an account? <a href="/login">Sign in</a></p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>
      </div>
    </div>
  );
};

export default Register;
