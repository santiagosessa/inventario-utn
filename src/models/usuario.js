import mongoose from 'mongoose';

const esquema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
  sal: { type: String, required: true, select: false },
  hash: { type: String, required: true, select: false },
}, { timestamps: true, versionKey: false, bufferCommands: false });

export default mongoose.model('Usuario', esquema);
