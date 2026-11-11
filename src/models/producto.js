import mongoose from 'mongoose';

const esquema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'Ingresá un nombre.'], trim: true, maxlength: 100 },
  categoria: { type: String, required: [true, 'Ingresá una categoría.'], trim: true, maxlength: 60 },
  precio: { type: Number, required: [true, 'Ingresá un precio.'], min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0, validate: {
    validator: Number.isSafeInteger,
    message: 'El stock debe ser un número entero.',
  } },
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', default: null, index: true },
}, { timestamps: true, versionKey: false, bufferCommands: false });

export default mongoose.model('Producto', esquema);
