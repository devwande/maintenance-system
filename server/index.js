import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import StudentModel from "./models/Student.js";
import MaintenanceRequest from './models/MaintenanceRequest.js';
import multer from 'multer';
import path from 'path';


const app = express();


app.use('/server/uploads', express.static('uploads'));

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

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const signToken = (regNumber) => {
    return jwt.sign({ regNumber }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

app.post("/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body;

    if (!regNumber || !password) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Please provide registration number and password' 
      });
    }

    const user = await StudentModel.findOne({ regNumber }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect registration number or password'
      });
    }

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

app.post("/register", async (req, res) => {
  try {
    const { name, regNumber, email, dormitory, password } = req.body;

    if (!name || !regNumber || !email || !dormitory || !password) {
      return res.status(400).json({ 
        status: 'fail',
        message: "All fields are required" 
      });
    }

    const newStudent = await StudentModel.create({
      name,
      regNumber,
      email,
      dormitory,
      password
    });

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

app.get("/protected", async (req, res) => {
  try {
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

    const decoded = jwt.verify(token, JWT_SECRET);

    const currentUser = await StudentModel.findOne({ regNumber: decoded.regNumber });
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  const upload = multer({ storage });

app.post('/api/requests', upload.single('image'), async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        studentRegNumber: req.body.studentRegNumber,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };
      const request = await MaintenanceRequest.create(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/requests/:regNumber', async (req, res) => {
    try {
      const requests = await MaintenanceRequest.find({ studentRegNumber: req.params.regNumber }).sort({ createdAt: -1 });
      res.json(requests); // always send an array
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});