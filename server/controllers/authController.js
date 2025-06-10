import jwt from "jsonwebtoken"
import StudentModel from "../models/Student.js"
import WorkerModel from "../models/Worker.js"
import AdminModel from "../models/Admin.js"

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "90d"

const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export const studentLogin = async (req, res) => {
  try {
    const { regNumber, password } = req.body

    if (!regNumber || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide registration number and password",
      })
    }

    const user = await StudentModel.findOne({ regNumber }).select("+password")

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect registration number or password",
      })
    }

    const token = signToken(user.regNumber, "student")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          name: user.name,
          regNumber: user.regNumber,
          email: user.email,
          dormitory: user.dormitory,
          roomNumber: user.roomNumber,
          role: "student",
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

export const studentRegister = async (req, res) => {
  try {
    const { name, regNumber, email, dormitory, roomNumber, password } = req.body

    if (!name || !regNumber || !email || !dormitory || !roomNumber || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      })
    }

    const newStudent = await StudentModel.create({
      name,
      regNumber,
      email,
      dormitory,
      roomNumber,
      password,
    })

    const token = signToken(newStudent.regNumber, "student")

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          name: newStudent.name,
          regNumber: newStudent.regNumber,
          email: newStudent.email,
          dormitory: newStudent.dormitory,
          roomNumber: newStudent.roomNumber,
          role: "student",
        },
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(409).json({
        status: "fail",
        message: `${field} already in use`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
    })
  }
}

export const workerLogin = async (req, res) => {
  try {
    const { name, password, role } = req.body

    if (!name || !password || !role) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, password and role",
      })
    }

    const worker = await WorkerModel.findOne({ name, role }).select("+password")

    if (!worker || !(await worker.correctPassword(password, worker.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect credentials",
      })
    }

    const token = signToken(worker._id, "worker")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: worker._id,
          name: worker.name,
          role: worker.role,
          userType: "worker",
        },
      },
    })
  } catch (error) {
    console.error("Worker login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

export const workerRegister = async (req, res) => {
  try {
    const { name, role, password } = req.body

    if (!name || !role || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      })
    }

    const newWorker = await WorkerModel.create({
      name,
      role,
      password,
    })

    const token = signToken(newWorker._id, "worker")

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          id: newWorker._id,
          name: newWorker.name,
          role: newWorker.role,
          userType: "worker",
        },
      },
    })
  } catch (error) {
    console.error("Worker registration error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(409).json({
        status: "fail",
        message: `${field} already in use`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
    })
  }
}

export const adminLogin = async (req, res) => {
  try {
    const { name, dormitory, password } = req.body

    if (!name || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name and password",
      })
    }

    let adminName = name

    // If dormitory is selected and it's not "All", construct the admin name
    if (dormitory && dormitory !== "All") {
      adminName = `${dormitory.toLowerCase().replace(" ", "_")}_admin`
    }

    const admin = await AdminModel.findOne({ name: adminName }).select("+password")

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect credentials",
      })
    }

    const token = signToken(admin._id, "admin")

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          dormitory: dormitory || null,
          userType: "admin",
        },
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, userType, newPassword } = req.body

    if (!email || !userType || !newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Email, user type, and new password are required",
      })
    }

    let user
    if (userType === "student") {
      user = await StudentModel.findOne({ email })
    } else if (userType === "worker") {
      user = await WorkerModel.findOne({ email })
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid user type",
      })
    }

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No account found with this email",
      })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}
