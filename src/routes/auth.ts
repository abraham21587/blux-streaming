import { Router } from 'express';
import { registrar, login, solicitarCodigo, verificarCodigo, cambiarContraseña } from '../controllers/AuthController.js';

const router = Router();

router.post('/registrar',           registrar);
router.post('/login',               login);
router.post('/recuperar/solicitar', solicitarCodigo);
router.post('/recuperar/verificar', verificarCodigo);
router.post('/recuperar/cambiar',   cambiarContraseña);

export default router;