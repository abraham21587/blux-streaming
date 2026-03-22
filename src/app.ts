import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes      from './routes/auth.js';
import contenidoRoutes from './routes/contenido.js';
import perfilRoutes    from './routes/perfiles.js';
import favoritoRoutes  from './routes/favoritos.js';
import adminRoutes     from './routes/admin.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/v1/auth',      authRoutes);
app.use('/v1/flux',      contenidoRoutes);
app.use('/v1/perfiles',  perfilRoutes);
app.use('/v1/favoritos', favoritoRoutes);
app.use('/v1/admin',     adminRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor BLUX corriendo en http://localhost:${PORT}`);
    });
});