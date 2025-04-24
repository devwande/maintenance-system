import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import StudentModel from "./models/Student.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/student")

app.post("/login", (req, res) => {
    const { regNumber, password } = req.body;
    StudentModel.findOne({ regNumber: regNumber })
    .then(user => {
        if(user) {
            if (user.password === password) {
                res.json("success")
            } else {
                res.json("the password is incorrect")
            }
        } else {
            res.json("No record existed")
        }
    })
})

app.post("/register", (req, res) => {
    StudentModel.create(req.body)
        .then((studentRegister) => {
            res.json(studentRegister);
        })
        .catch((err) => {
            res.json(err);
        });
})

app.listen(3001, () => {
    console.log("Server is running on port 3001");
})
