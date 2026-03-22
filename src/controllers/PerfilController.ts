import { Request, Response } from 'express';
import Perfil from '../models/Perfil.js';

// GET /v1/perfiles/listar?correo=x
export const getPerfiles = async (req: Request, res: Response) => {
    try {
        const { correo } = req.query;
        if (!correo) return res.status(400).json({ error: 'Correo requerido.' });

        const perfiles = await Perfil.find({ usuarioCorreo: (correo as string).toLowerCase() });
        res.json(perfiles);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al obtener perfiles.' });
    }
};

// POST /v1/perfiles/crear
// body: { nombre, avatarUrl, usuarioCorreo, esMenor?, pin? }
export const crearPerfil = async (req: Request, res: Response) => {
    try {
        const { nombre, avatarUrl, usuarioCorreo, esMenor, pin } = req.body;
        if (!nombre || !usuarioCorreo)
            return res.status(400).json({ error: 'Nombre y correo son requeridos.' });

        const cantidad = await Perfil.countDocuments({ usuarioCorreo: usuarioCorreo.toLowerCase() });
        if (cantidad >= 5)
            return res.status(400).json({ error: 'Máximo 5 perfiles por usuario.' });

        const perfil = await Perfil.create({
            nombre,
            avatarUrl: avatarUrl || 'https://i.pravatar.cc/150',
            usuarioCorreo: usuarioCorreo.toLowerCase(),
            esMenor: esMenor ?? false,
            pin: pin || ''
        });
        res.status(201).json(perfil);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al crear perfil.' });
    }
};

// POST /v1/perfiles/guardar-lote
// body: array de { nombre, avatarUrl, usuarioCorreo }
export const crearLote = async (req: Request, res: Response) => {
    try {
        const perfiles = req.body;
        if (!Array.isArray(perfiles) || perfiles.length === 0)
            return res.status(400).json({ error: 'Se esperaba un array de perfiles.' });
        if (perfiles.length > 5)
            return res.status(400).json({ error: 'Máximo 5 perfiles por lote.' });

        const creados = await Perfil.insertMany(
            perfiles.map((p: any) => ({
                ...p,
                usuarioCorreo: p.usuarioCorreo?.toLowerCase()
            }))
        );
        res.status(201).json(creados);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al guardar perfiles.' });
    }
};

// PUT /v1/perfiles/actualizar/:id
// body: { nombre?, avatarUrl?, pin? }
export const editarPerfil = async (req: Request, res: Response) => {
    try {
        const { nombre, avatarUrl, pin } = req.body;
        const perfil = await Perfil.findByIdAndUpdate(
            req.params.id,
            { ...(nombre && { nombre }), ...(avatarUrl && { avatarUrl }), ...(pin !== undefined && { pin }) },
            { new: true, runValidators: true }
        );
        if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado.' });
        res.json(perfil);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al editar perfil.' });
    }
};

// DELETE /v1/perfiles/:id
export const eliminarPerfil = async (req: Request, res: Response) => {
    try {
        const perfil = await Perfil.findByIdAndDelete(req.params.id);
        if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado.' });
        res.json({ mensaje: 'Perfil eliminado.' });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al eliminar perfil.' });
    }
};