import { Router } from 'express';
import { getUsuarios, getUsuarioById, cambiarRol, eliminarUsuario, eliminarContenido, getStats } from '../controllers/AdminController.js';

const router = Router();

// Todos requieren ?correoAdmin=x
router.get('/usuarios',         getUsuarios);
router.get('/usuarios/:id',     getUsuarioById);
router.put('/rol',              cambiarRol);
router.delete('/usuarios/:id',  eliminarUsuario);
router.delete('/contenido/:id', eliminarContenido);
router.get('/stats',            getStats);

export default router;