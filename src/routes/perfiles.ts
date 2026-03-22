import { Router } from 'express';
import { getPerfiles, crearPerfil, crearLote, editarPerfil, eliminarPerfil } from '../controllers/PerfilController.js';

const router = Router();

router.get('/listar',         getPerfiles);    // ?correo=x
router.post('/crear',         crearPerfil);    // body: { nombre, avatarUrl, usuarioCorreo }
router.post('/guardar-lote',  crearLote);      // body: array de perfiles
router.put('/actualizar/:id', editarPerfil);   // body: { nombre?, avatarUrl?, pin? }
router.delete('/:id',         eliminarPerfil);

export default router;