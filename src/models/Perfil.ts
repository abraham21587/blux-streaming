import { Schema, model, Document } from 'mongoose';

export interface IPerfil extends Document {
    nombre: string;
    avatarUrl: string;
    usuarioCorreo: string;
    esMenor: boolean;
    pin?: string;
}

const PerfilSchema = new Schema<IPerfil>({
    nombre:        { type: String, required: true, trim: true },
    avatarUrl:     { type: String, default: 'https://i.pravatar.cc/150' },
    usuarioCorreo: { type: String, required: true, lowercase: true },
    esMenor:       { type: Boolean, default: false },
    pin:           { type: String, default: '' }
}, { timestamps: true });

export default model<IPerfil>('Perfil', PerfilSchema);