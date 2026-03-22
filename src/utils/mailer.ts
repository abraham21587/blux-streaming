import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

export const enviarCodigo = async (correoDestino: string, codigo: string) => {
    await transporter.sendMail({
        from: `"BLUX" <${process.env.GMAIL_USER}>`,
        to: correoDestino,
        subject: '🔐 Código de recuperación BLUX',
        html: `
            <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:30px;border-radius:10px;background:#111;color:#fff">
                <h2 style="color:#a855f7">BLUX</h2>
                <p>Tu código de recuperación es:</p>
                <h1 style="letter-spacing:8px;color:#a855f7">${codigo}</h1>
                <p style="color:#999;font-size:12px">Expira en 10 minutos. Si no lo solicitaste, ignora este correo.</p>
            </div>
        `
    });
};