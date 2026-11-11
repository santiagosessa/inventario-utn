import mongoose from 'mongoose';

const esquema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  ciudad: { type: String, required: true, trim: true, maxlength: 80 },
  archivadoEn: { type: Date, default: null },
}, { timestamps: true, versionKey: false, bufferCommands: false });

export default mongoose.model('Proveedor', esquema);
