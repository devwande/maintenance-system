import mongoose from 'mongoose';

const StudentSchema =  new mongoose.Schema({
    name: String,
    regNumber: String,
    email: String,
    dormitory: String,
    password: String,
    confirmPassword: String
})

const StudentModel = mongoose.model("studentRegister", StudentSchema)

export default StudentModel;