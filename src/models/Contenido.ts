import { Schema, model, Document } from 'mongoose';

export interface IContenido extends Document {
    titulo: string;
    plataforma?: string;
    tipo?: string;
    url?: string;
    imagen?: string;
    seccion?: string;
    descripcion?: string;
    año?: number;
    genero?: string;
    rating?: number;
}

const ContenidoSchema = new Schema<IContenido>({
    titulo:      { type: String, required: true, trim: true },
    plataforma:  { type: String, default: '' },
    tipo:        { type: String, default: 'PELICULA' },
    url:         { type: String, default: '' },
    imagen:      { type: String, default: '' },
    seccion:     { type: String, default: 'General' },
    descripcion: { type: String, default: '' },
    año:         { type: Number },
    genero:      { type: String, default: '' },
    rating:      { type: Number, min: 0, max: 10 }
}, { timestamps: true });

ContenidoSchema.index({ titulo: 'text', genero: 'text', descripcion: 'text' });

export default model<IContenido>('Contenido', ContenidoSchema);