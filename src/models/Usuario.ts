import { Schema, model, Document } from 'mongoose';

export interface IUsuario extends Document {
    correo: string;
    contraseña: string;
    telefono?: string;
    rol: string;
}

const UsuarioSchema = new Schema<IUsuario>({
    correo:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    contraseña: { type: String, required: true },
    telefono:   { type: String, default: '' },
    rol:        { type: String, default: 'USER', enum: ['USER', 'ADMIN', 'MOD'] }
}, { timestamps: true });

export default model<IUsuario>('Usuario', UsuarioSchema);