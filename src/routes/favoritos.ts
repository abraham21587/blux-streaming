import { Router } from 'express';
import { getFavoritos, agregarFavorito, eliminarFavorito } from '../controllers/FavoritoController.js';

const router = Router();

router.get('/mis-favoritos', getFavoritos);   // ?correo=x
router.post('/agregar',      agregarFavorito); // body: { correo, contenidoId }
router.delete('/eliminar',   eliminarFavorito);// ?correo=x&contenidoId=y

export default router;