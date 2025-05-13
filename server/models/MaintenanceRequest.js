import mongoose from 'mongoose';

const MaintenanceRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }, // Will store the path to uploaded image
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed'] },
  studentRegNumber: { type: String, required: true },
  workerFeedback: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
MaintenanceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);