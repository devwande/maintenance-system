import { useNavigate } from "react-router-dom";
import Logo from "../src/assets/cu_logo.jpg"
import { Building2, School, Wrench } from "lucide-react";

const UserSelection = () => {
    const navigate = useNavigate();
  return (
    <>
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 bg-cover bg-center" style={{
        backgroundImage: `url('../src/assets/dorm1.jpg')`,
      }}>
            <div className="flex flex-col items-center justify-center text-center bg-gray-50 p-8 max-w-[600px] rounded-lg shadow-md ">
                <img src={Logo} alt="Covenant University Logo" className="max-w-[100px]"/>
                <h1 className="text-3xl font-bold">Dormitory Maintenance Request System</h1>
                <p className="mt-2 text-gray-600">Please select your user type to continue</p>

                <div className="grid gap-4 mt-8 ">
                    <button className={`cursor-pointer transition-all hover:shadow-md text-start`} onClick={() => navigate("/login")}>
                        <div className="flex flex-row items-center gap-4 border border-gray-500 p-3 rounded-sm">
                        <School className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-bold text-xl t">Student</div>
                            <div>Submit and track maintenance requests</div>
                        </div>
                        </div>
                    </button>

                    <button className={`cursor-pointer transition-all hover:shadow-md text-start`} onClick={() => navigate("/worker")} >
                        <div className="flex flex-row items-center gap-4 border border-gray-500 p-3 rounded-sm">
                        <Wrench className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-bold text-xl">Maintenance Worker</div>
                            <div>View and manage assigned tasks</div>
                        </div>
                        </div>
                    </button>

                    <button className={`cursor-pointer transition-all hover:shadow-md text-start`} onClick={() => navigate("/admin")} >
                        <div className="flex flex-row items-center gap-4 border border-gray-500 p-3 rounded-sm">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                            <div className="font-bold text-xl">Hall Officer (Admin)</div>
                            <div>Oversee all maintenance activities</div>
                        </div>
                        </div>
                    </button>
                </div>
            </div>
        </main>
    </>
  )
}

export default UserSelection