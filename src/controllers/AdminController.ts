import { Request, Response } from 'express';
import Usuario from '../models/Usuario.js';
import Contenido from '../models/Contenido.js';
import Favorito from '../models/Favorito.js';

const isAdmin = (req: Request): boolean =>
    req.query.correoAdmin === process.env.ADMIN_EMAIL;

// GET /v1/admin/usuarios?correoAdmin=x
export const getUsuarios = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const usuarios = await Usuario.find({}, 'correo telefono rol createdAt').sort({ createdAt: -1 });
        res.json(usuarios);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
};

// GET /v1/admin/usuarios/:id?correoAdmin=x
export const getUsuarioById = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const usuario = await Usuario.findById(req.params.id, 'correo telefono rol createdAt');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json(usuario);
    } catch (e: any) {
        res.status(500).json({ error: 'Error al obtener usuario.' });
    }
};

// PUT /v1/admin/rol?correoAdmin=x
// body: { correo, nuevoRol }
export const cambiarRol = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const { correo, nuevoRol } = req.body;
        if (!['USER', 'ADMIN', 'MOD'].includes(nuevoRol))
            return res.status(400).json({ error: 'Rol inválido. Usa: USER, ADMIN o MOD.' });

        const user = await Usuario.findOneAndUpdate(
            { correo: correo?.toLowerCase() },
            { rol: nuevoRol },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json({ mensaje: `Rol actualizado a ${nuevoRol}.`, usuario: user.correo });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al cambiar rol.' });
    }
};

// DELETE /v1/admin/usuarios/:id?correoAdmin=x
export const eliminarUsuario = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const user = await Usuario.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Limpiar favoritos del usuario eliminado
        await Favorito.deleteMany({ usuarioCorreo: user.correo });

        res.json({ mensaje: 'Usuario eliminado correctamente.' });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al eliminar usuario.' });
    }
};

// DELETE /v1/admin/contenido/:id?correoAdmin=x
export const eliminarContenido = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const contenido = await Contenido.findByIdAndDelete(req.params.id);
        if (!contenido) return res.status(404).json({ error: 'Contenido no encontrado.' });
        res.json({ mensaje: 'Contenido eliminado.' });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al eliminar contenido.' });
    }
};

// GET /v1/admin/stats?correoAdmin=x  — estadísticas generales
export const getStats = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const [totalUsuarios, totalContenido, totalFavoritos] = await Promise.all([
            Usuario.countDocuments(),
            Contenido.countDocuments(),
            Favorito.countDocuments()
        ]);

        const porTipo = await Contenido.aggregate([
            { $group: { _id: '$tipo', cantidad: { $sum: 1 } } }
        ]);

        res.json({ totalUsuarios, totalContenido, totalFavoritos, porTipo });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};