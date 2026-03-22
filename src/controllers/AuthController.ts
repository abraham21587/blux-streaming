import { Request, Response } from 'express';
import Usuario from '../models/Usuario.js';
import { enviarCodigo } from '../utils/mailer.js';

// Almacén temporal de códigos (en producción usar Redis)
const codigos: Record<string, { codigo: string; expira: number }> = {};

// POST /v1/auth/registrar
export const registrar = async (req: Request, res: Response) => {
    try {
        const { correo, password, telefono } = req.body;
        if (!correo || !password)
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });

        const existe = await Usuario.findOne({ correo: correo.toLowerCase() });
        if (existe)
            return res.status(400).json({ error: 'Este correo ya está registrado.' });

        await Usuario.create({ correo, contraseña: password, telefono });
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
    } catch (e: any) {
        console.error('registrar:', e.message);
        res.status(500).json({ error: 'Error en el registro.' });
    }
};

// POST /v1/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { correo, password } = req.body;
        if (!correo || !password)
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });

        const user = await Usuario.findOne({ correo: correo.toLowerCase() });
        if (!user || user.contraseña !== password)
            return res.status(401).json({ error: 'Credenciales incorrectas.' });

        res.json({
            mensaje: `Bienvenid@ ${user.correo}`,
            rol: user.rol,
            id: user._id
        });
    } catch (e: any) {
        console.error('login:', e.message);
        res.status(500).json({ error: 'Error en el login.' });
    }
};

// POST /v1/auth/recuperar/solicitar
export const solicitarCodigo = async (req: Request, res: Response) => {
    try {
        const { correo } = req.body;
        if (!correo)
            return res.status(400).json({ error: 'Correo requerido.' });

        const user = await Usuario.findOne({ correo: correo.toLowerCase() });
        if (!user)
            return res.status(404).json({ error: 'Correo no registrado.' });

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        codigos[correo.toLowerCase()] = { codigo, expira: Date.now() + 10 * 60 * 1000 };

        await enviarCodigo(correo, codigo);
        res.json({ mensaje: 'Código enviado al correo.' });
    } catch (e: any) {
        console.error('solicitarCodigo:', e.message);
        res.status(500).json({ error: 'Error al enviar el código.' });
    }
};

// POST /v1/auth/recuperar/verificar
export const verificarCodigo = async (req: Request, res: Response) => {
    try {
        const { correo, codigo } = req.body;
        const entrada = codigos[correo?.toLowerCase()];

        if (!entrada)
            return res.status(400).json({ error: 'No hay código solicitado.' });
        if (Date.now() > entrada.expira) {
            delete codigos[correo.toLowerCase()];
            return res.status(400).json({ error: 'El código expiró.' });
        }
        if (entrada.codigo !== codigo)
            return res.status(400).json({ error: 'Código incorrecto.' });

        res.json({ mensaje: 'Código válido.' });
    } catch (e: any) {
        res.status(500).json({ error: 'Error al verificar el código.' });
    }
};

// POST /v1/auth/recuperar/cambiar
export const cambiarContraseña = async (req: Request, res: Response) => {
    try {
        const { correo, codigo, newPassword } = req.body;
        const entrada = codigos[correo?.toLowerCase()];

        if (!entrada || entrada.codigo !== codigo || Date.now() > entrada.expira)
            return res.status(400).json({ error: 'Código inválido o expirado.' });

        const user = await Usuario.findOne({ correo: correo.toLowerCase() });
        if (!user)
            return res.status(404).json({ error: 'Usuario no encontrado.' });

        user.contraseña = newPassword;
        await user.save();
        delete codigos[correo.toLowerCase()];

        res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
    } catch (e: any) {
        console.error('cambiarContraseña:', e.message);
        res.status(500).json({ error: 'Error al cambiar la contraseña.' });
    }
};