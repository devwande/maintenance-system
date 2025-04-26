import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import StudentModel from "./models/Student.js";

const app = express();

// Environment variables
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Create JWT token
const signToken = (regNumber) => {
    return jwt.sign({ regNumber }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body;
    
    // 1) Check if email and password exist
    if (!regNumber || !password) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Please provide registration number and password' 
      });
    }

    // 2) Check if user exists and password is correct
    const user = await StudentModel.findOne({ regNumber }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect registration number or password'
      });
    }

    // 3) If everything ok, send token to client
    const token = signToken(user.regNumber);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          name: user.name,
          regNumber: user.regNumber,
          email: user.email,
          dormitory: user.dormitory
        }
      }
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      status: 'error',
      message: "Internal server error" 
    });
  }
});

// Register endpoint (updated with password hashing via model middleware)
app.post("/register", async (req, res) => {
  try {
    const { name, regNumber, email, dormitory, password } = req.body;

    // 1) Check for required fields
    if (!name || !regNumber || !email || !dormitory || !password) {
      return res.status(400).json({ 
        status: 'fail',
        message: "All fields are required" 
      });
    }

    // 2) Create new user (password will be hashed by pre-save middleware)
    const newStudent = await StudentModel.create({
      name,
      regNumber,
      email,
      dormitory,
      password
    });

    // 3) Generate JWT token
    const token = signToken(newStudent.regNumber);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newStudent
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        status: 'fail',
        message: `${field} already in use` 
      });
    }
    
    res.status(500).json({ 
      status: 'error',
      message: "Registration failed. Please try again."
    });
  }
});

// Protected route example
app.get("/protected", async (req, res) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await StudentModel.findOne({ regNumber: decoded.regNumber });
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Grant access to protected route
    res.status(200).json({
      status: 'success',
      data: {
        user: currentUser
      }
    });

  } catch (error) {
    console.error("Protected route error:", error);
    res.status(500).json({ 
      status: 'error',
      message: "Internal server error" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});