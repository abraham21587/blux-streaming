import { Request, Response } from 'express';
import axios from 'axios';
import Contenido from '../models/Contenido.js';

interface TwitchStream {
    user_name: string;
    user_login: string;
    title: string;
    thumbnail_url: string;
    game_name: string;
    viewer_count: number;
}

const getTwitchToken = async (): Promise<string> => {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const res = await axios.post<{ access_token: string }>(url);
    return res.data.access_token;
};

const formatearStream = (s: TwitchStream) => ({
    id:        s.user_login,
    titulo:    s.title,
    canal:     s.user_name,
    tipo:      'LIVE',
    url:       `https://twitch.tv/${s.user_login}`,
    imagen:    s.thumbnail_url.replace('{width}x{height}', '600x338'),
    seccion:   s.game_name || 'Streaming',
    viewers:   s.viewer_count
});

// GET /v1/flux/home
export const getHome = async (req: Request, res: Response) => {
    try {
        const catalogo = await Contenido.find().sort({ createdAt: -1 });

        let en_vivo: any[] = [];
        try {
            const token = await getTwitchToken();
            const twitchRes = await axios.get<{ data: TwitchStream[] }>(
                'https://api.twitch.tv/helix/streams?first=50',
                { headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID!, 'Authorization': `Bearer ${token}` } }
            );
            en_vivo = twitchRes.data.data.map(formatearStream);
        } catch (twitchErr: any) {
            console.warn('⚠️  Twitch no disponible:', twitchErr.message);
        }

        res.json({ catalogo, en_vivo });
    } catch (error: any) {
        console.error('getHome:', error.message);
        res.status(500).json({ error: 'Error al cargar el Home.' });
    }
};

// GET /v1/flux/catalogo
export const getCatalogo = async (req: Request, res: Response) => {
    try {
        const { tipo, seccion } = req.query;
        const filtro: any = {};
        if (tipo)    filtro.tipo    = tipo;
        if (seccion) filtro.seccion = seccion;

        const items = await Contenido.find(filtro).sort({ createdAt: -1 });
        res.json(items); // ← array directo, igual que antes con SQLite
    } catch (error: any) {
        res.status(500).json({ error: 'Error al cargar el catálogo.' });
    }
};

// GET /v1/flux/catalogo/:id
export const getContenidoById = async (req: Request, res: Response) => {
    try {
        const item = await Contenido.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Contenido no encontrado.' });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al obtener el contenido.' });
    }
};

// GET /v1/flux/en-vivo
export const getEnVivo = async (req: Request, res: Response) => {
    try {
        const token = await getTwitchToken();
        const twitchRes = await axios.get<{ data: TwitchStream[] }>(
            'https://api.twitch.tv/helix/streams?first=20',
            { headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID!, 'Authorization': `Bearer ${token}` } }
        );
        res.json(twitchRes.data.data.map(formatearStream));
    } catch (error: any) {
        console.error('getEnVivo:', error.message);
        res.status(500).json({ error: 'Error al cargar streams en vivo.' });
    }
};

// GET /v1/flux/buscar?query=xxx
export const buscarContenido = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const resultados = await Contenido.find({
            $or: [
                { titulo:      { $regex: query as string, $options: 'i' } },
                { descripcion: { $regex: query as string, $options: 'i' } },
                { genero:      { $regex: query as string, $options: 'i' } }
            ]
        }).limit(30);

        res.json(resultados);
    } catch (error: any) {
        res.status(500).json({ error: 'Error en la búsqueda.' });
    }
};

// ── ADMIN ──────────────────────────────────────────────────────────────────

const isAdmin = (req: Request): boolean =>
    req.query.correoAdmin === process.env.ADMIN_EMAIL;


// POST /v1/flux/admin/agregar
export const agregarContenido = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos de administrador.' });

        console.log('📦 Body recibido:', JSON.stringify(req.body));
        console.log('🔑 correoAdmin recibido:', req.query.correoAdmin);
        console.log('🔑 ADMIN_EMAIL en .env:', process.env.ADMIN_EMAIL);

        const nuevo = await Contenido.create(req.body);
        res.status(201).json(nuevo);
    } catch (error: any) {
        console.error('❌ Error completo:', error);
        res.status(500).json({ error: error.message || 'Error al guardar el contenido.' });
    }
};

// PUT /v1/flux/admin/editar/:id
export const editarContenido = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const item = await Contenido.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ error: 'Contenido no encontrado.' });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al editar el contenido.' });
    }
};

// DELETE /v1/flux/admin/eliminar/:id
export const eliminarContenido = async (req: Request, res: Response) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ error: 'No tienes permisos.' });

        const item = await Contenido.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: 'Contenido no encontrado.' });
        res.json({ mensaje: 'Contenido eliminado.' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar.' });
    }
};