import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserSelection from './UserSelection';
import StudentDashboard from './student/StudentDashboard';
import Login from './student/auth/Login';
import Register from './student/auth/Register';
import WorkerLogin from './workers/auth/WorkerLogin';
import WorkerRegister from './workers/auth/WorkerRegister';
import WorkerDashboard from './workers/WorkerDashboard';
import AdminLogin from './admin/auth/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<UserSelection />} />
          <Route path='/studentdashboard' element={<StudentDashboard />} />
          <Route path='/login' element={<Login />}/>
          <Route path='/register' element={<Register />}/>
          
          {/* Worker Routes */}
          <Route path='/worker' element={<WorkerLogin />}/>
          <Route path='/worker/register' element={<WorkerRegister />}/>
          <Route path='/workerdashboard' element={<WorkerDashboard />}/>
          
          {/* Admin Routes */}
          <Route path='/admin' element={<AdminLogin />}/>
          <Route path='/admindashboard' element={<AdminDashboard />}/>
        </Routes>
      </div>
    </Router>
  )
}

export default App