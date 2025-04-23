import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserSelection from './UserSelection';
// import StudentDashboard from './student/StudentDashboard';
import StudentAuth from './student/auth/StudentAuth';


const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<UserSelection />} />
          <Route path='/student' element={<StudentAuth />}/>
          {/* <Route path='/studentdashboard' element={<StudentDashboard />} /> */}
        </Routes>
      </div>
    </Router>
  )
}

export default App