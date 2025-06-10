import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  regNumber: {
    type: String,
    required: [true, "Registration number is required"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  dormitory: {
    type: String,
    required: [true, "Dormitory is required"],
  },
  roomNumber: {
    type: String,
    required: [true, "Room number is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
})

StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

StudentSchema.methods.correctPassword = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword)

const StudentModel = mongoose.model("Student", StudentSchema)
export default StudentModel
