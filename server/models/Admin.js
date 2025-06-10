import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  dormitory: {
    type: String,
    default: null, // null for general admin, specific hall for hall admins
  },
})

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

AdminSchema.methods.correctPassword = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword)

const AdminModel = mongoose.model("Admin", AdminSchema)
export default AdminModel
