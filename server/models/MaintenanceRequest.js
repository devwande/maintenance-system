import mongoose from "mongoose"

const MaintenanceRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }, // Will store the path to uploaded image
  status: { type: String, default: "Pending", enum: ["Pending", "In Progress", "Completed"] },
  studentRegNumber: { type: String, required: true },
  workerFeedback: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  priority: { type: String, default: "Medium", enum: ["Low", "Medium", "High", "Critical"] },
  rating: { type: Number, min: 1, max: 5 },
  resolutionTime: { type: Number }, // Time taken to resolve in hours
  assignedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Update the updatedAt field on save
MaintenanceRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

export default mongoose.model("MaintenanceRequest", MaintenanceRequestSchema)
