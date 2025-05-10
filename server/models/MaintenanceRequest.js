import mongoose from 'mongoose';

const MaintenanceRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }, // Will store the path to uploaded image
  status: { type: String, default: 'Pending' }, // Pending, In Progress, Completed
  studentRegNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);