import { Schema, model, Document } from 'mongoose';

export interface IFavorito extends Document {
    usuarioCorreo: string;
    contenidoId: string;
    titulo?: string;
    imagen?: string;
    url?: string;
    tipo?: string;
}

const FavoritoSchema = new Schema<IFavorito>({
    usuarioCorreo: { type: String, required: true, lowercase: true },
    contenidoId:   { type: String, required: true },  // MongoDB ObjectId como string
    titulo:        { type: String, default: '' },
    imagen:        { type: String, default: '' },
    url:           { type: String, default: '' },
    tipo:          { type: String, default: '' }
}, { timestamps: true });

// Evitar duplicados: un usuario no puede tener el mismo contenido dos veces
FavoritoSchema.index({ usuarioCorreo: 1, contenidoId: 1 }, { unique: true });

export default model<IFavorito>('Favorito', FavoritoSchema);