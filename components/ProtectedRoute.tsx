// // frontend/src/components/ProtectedRoute.js
// import { Navigate } from 'react-router-dom';
// // import  useAuth  from '../context/AuthContext';


// const ProtectedRoute = ({ children }: any) => {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;

// function useAuth(): { user: any; isLoading: any; } {
//   throw new Error('Function not implemented.');
// }
