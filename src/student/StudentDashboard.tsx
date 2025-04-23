// // frontend/src/components/StudentDashboard.jsx
// import { useNavigate } from "react-router-dom";
// // import { useAuth } from "../context/AuthContext";

// const StudentDashboard = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="bg-white shadow">
//         <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
//           <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
//           <button
//             onClick={handleLogout}
//             className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
//           >
//             Logout
//           </button>
//         </div>
//       </header>
//       <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
//         <div className="bg-white shadow rounded-lg p-6 mb-6">
//           <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-gray-500">Registration Number</p>
//               <p className="font-medium">{user?.regNumber}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Email</p>
//               <p className="font-medium">{user?.email}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Hall and Room</p>
//               <p className="font-medium">{user?.dormitory}</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white shadow rounded-lg p-6">
//           <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
//           <p className="text-gray-500 mb-4">You haven't submitted any maintenance requests yet.</p>
//           <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
//             Submit New Request
//           </button>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default StudentDashboard;

// function useAuth(): { user: any; logout: any; } {
//     throw new Error("Function not implemented.");
// }
