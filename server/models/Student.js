import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'] 
    },
    regNumber: { 
        type: String, 
        required: [true, 'Registration number is required'],
        unique: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    dormitory: { 
        type: String, 
        required: [true, 'Dormitory information is required'] 
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    }
});

const StudentModel = mongoose.model("studentregister", StudentSchema);

export default StudentModel;