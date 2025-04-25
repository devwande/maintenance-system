import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import StudentModel from "./models/Student.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/student")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.post("/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body;
    if (!regNumber || !password) {
      return res.status(400).json({ message: "Registration number and password are required" });
    }

    const user = await StudentModel.findOne({ regNumber });
    
    if (!user) {
      return res.status(404).json({ message: "No account found with this registration number" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({ message: "Login successful", user: { name: user.name, regNumber: user.regNumber } });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
    try {
      console.log("Request Body:", req.body); // Log incoming data
  
      const { name, regNumber, email, dormitory, password } = req.body;

      if (!name || !regNumber || !email || !dormitory || !password) {
        console.log("Missing fields:", { name, regNumber, email, dormitory, password });
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await StudentModel.findOne({ regNumber });
      if (existingUser) {
        return res.status(409).json({ message: "Registration number already in use" });
      }

      const existingEmail = await StudentModel.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const newStudent = await StudentModel.create({
        name,
        regNumber,
        email,
        dormitory,
        password,
      });
  
      res.status(201).json({ 
        message: "Registration successful",
        user: {
          name: newStudent.name,
          regNumber: newStudent.regNumber,
          email: newStudent.email,
        },
      });
  
    } catch (error) {
      console.error("🔥 Registration Error:", error);
      
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        return res.status(409).json({ 
          message: `${duplicateField} already in use` 
        });
      }
  
      res.status(500).json({ 
        message: "Registration failed. Please try again.",
        error: error.message,
      });
    }
  });

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});