import { Router } from 'express';
import {
    getHome, getCatalogo, getContenidoById,
    getEnVivo, buscarContenido,
    agregarContenido, editarContenido, eliminarContenido
} from '../controllers/ContenidoController.js';

const router = Router();

// Públicos
router.get('/home',           getHome);
router.get('/catalogo',       getCatalogo);
router.get('/catalogo/:id',   getContenidoById);
router.get('/en-vivo',        getEnVivo);
router.get('/buscar',         buscarContenido);      // ?query=xxx

// Admin (protegidos por query param correoAdmin)
router.post('/admin/agregar',        agregarContenido);
router.put('/admin/editar/:id',      editarContenido);
router.delete('/admin/eliminar/:id', eliminarContenido);

export default router;