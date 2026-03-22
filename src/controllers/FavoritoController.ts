import { Request, Response } from 'express';
import Favorito from '../models/Favorito.js';
import Contenido from '../models/Contenido.js';

// GET /v1/favoritos/mis-favoritos?correo=x
export const getFavoritos = async (req: Request, res: Response) => {
    try {
        const { correo } = req.query;
        if (!correo) return res.status(400).json({ error: 'Correo requerido.' });

        const favs = await Favorito.find({ usuarioCorreo: (correo as string).toLowerCase() });
        res.json(favs);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al obtener favoritos.' });
    }
};

// POST /v1/favoritos/agregar?correo=x&contenidoId=y
export const agregarFavorito = async (req: Request, res: Response) => {
    try {
        // Acepta tanto query params como body
        const correo      = (req.query.correo      || req.body.correo)      as string;
        const contenidoId = (req.query.contenidoId || req.body.contenidoId) as string;

        console.log('➕ Agregar favorito:', { correo, contenidoId });

        if (!correo || !contenidoId)
            return res.status(400).json({ error: 'Faltan datos: correo y contenidoId son requeridos.' });

        // Verificar que el contenido existe
        const contenido = await Contenido.findById(contenidoId);
        if (!contenido)
            return res.status(404).json({ error: 'Contenido no encontrado.' });

        // Verificar duplicado
        const existe = await Favorito.findOne({
            usuarioCorreo: correo.toLowerCase(),
            contenidoId
        });
        if (existe)
            return res.status(400).json({ error: 'Ya está en favoritos.' });

        const nuevo = await Favorito.create({
            usuarioCorreo: correo.toLowerCase(),
            contenidoId,
            titulo: contenido.titulo,
            imagen: contenido.imagen,
            url:    contenido.url,
            tipo:   contenido.tipo
        });

        res.status(201).json(nuevo);
    } catch (e: any) {
        console.error('❌ agregarFavorito:', e.message);
        res.status(500).json({ error: e.message || 'Error al agregar favorito.' });
    }
};

// DELETE /v1/favoritos/eliminar?correo=x&contenidoId=y
export const eliminarFavorito = async (req: Request, res: Response) => {
    try {
        const correo      = (req.query.correo      || req.body.correo)      as string;
        const contenidoId = (req.query.contenidoId || req.body.contenidoId) as string;

        if (!correo || !contenidoId)
            return res.status(400).json({ error: 'Faltan datos.' });

        const fav = await Favorito.findOneAndDelete({
            usuarioCorreo: correo.toLowerCase(),
            contenidoId
        });
        if (!fav)
            return res.status(404).json({ error: 'Favorito no encontrado.' });

        res.json({ mensaje: 'Eliminado de favoritos.' });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al eliminar favorito.' });
    }
};
