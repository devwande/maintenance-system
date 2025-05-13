// models/Worker.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const WorkerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'] 
    },
    role: { 
        type: String, 
        required: [true, 'Worker role is required'],
        enum: ['Electrician', 'Carpenter', 'Plumber', 'Other']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    }
});

// Hash password before saving
WorkerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare passwords
WorkerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Prevent overwrite error on hot reload
const WorkerModel = mongoose.models.Worker || mongoose.model("Worker", WorkerSchema);

export default WorkerModel;
