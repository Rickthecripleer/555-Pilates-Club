const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Configuración del servicio de email
 * Por defecto usa Gmail, pero puedes configurar otros proveedores
 */
const createTransporter = () => {
    // Configuración desde variables de entorno
    const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASSWORD || '', // Para Gmail, usar "App Password"
        },
    };

    // Si no hay configuración, retornar null (modo desarrollo)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        return null;
    }

    return nodemailer.createTransport(emailConfig);
};

/**
 * Enviar email de recuperación de contraseña
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 * @param {string} resetToken - Token de recuperación
 * @returns {Promise<boolean>} true si se envió exitosamente
 */
const enviarEmailRecuperacion = async (email, nombre, resetToken) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('📧 [Email] Modo desarrollo - Email no configurado');
            console.log(`   Para: ${email}`);
            console.log(`   Token: ${resetToken}`);
            console.log(`   Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
            console.log('   ⚠️ Configura EMAIL_USER y EMAIL_PASSWORD en .env para envío real');
            return true; // No fallar en desarrollo
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        // Intentar cargar el logo como base64 para incrustarlo en el email
        let logoImg = null;
        try {
            const logoPath = path.join(__dirname, '../frontend/public/logo-555-pilates.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                const logoBase64 = logoBuffer.toString('base64');
                logoImg = `data:image/png;base64,${logoBase64}`;
                console.log('✅ Logo cargado como base64 para el email');
            } else {
                console.warn('⚠️ Logo no encontrado, usando URL');
                logoImg = `${frontendUrl}/logo-555-pilates.png`;
            }
        } catch (logoError) {
            console.warn('⚠️ Error al cargar logo, usando URL:', logoError.message);
            logoImg = `${frontendUrl}/logo-555-pilates.png`;
        }

        const mailOptions = {
            from: `"555 Pilates Club" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperación de Contraseña - 555 Pilates Club',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .container {
                            background-color: #f9f7f2;
                            padding: 30px;
                            border-radius: 10px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .logo {
                            background-color: #fce7f3;
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            margin: 0 auto 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            font-weight: bold;
                            color: #ec4899;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #1e293b;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: 500;
                        }
                        .button:hover {
                            background-color: #334155;
                        }
                        .footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #666;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${logoImg}" alt="555 Pilates Club" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: block; object-fit: contain; background-color: #fce7f3; padding: 10px;" />
                            <h1 style="color: #1e293b; margin: 0;">555 Pilates Club</h1>
                        </div>
                        
                        <h2 style="color: #1e293b;">Hola ${nombre},</h2>
                        
                        <p>Recibimos una solicitud para recuperar tu contraseña. Si fuiste tú, haz clic en el botón de abajo para crear una nueva contraseña:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="button">Recuperar Contraseña</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">
                            O copia y pega este enlace en tu navegador:<br>
                            <a href="${resetLink}" style="color: #ec4899; word-break: break-all;">${resetLink}</a>
                        </p>
                        
                        <p style="font-size: 14px; color: #666;">
                            <strong>Este enlace expirará en 1 hora.</strong><br>
                            Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá igual.
                        </p>
                        
                        <div class="footer">
                            <p>555 Pilates Club - Salina Cruz, Oaxaca</p>
                            <p>Este es un email automático, por favor no respondas.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Hola ${nombre},
                
                Recibimos una solicitud para recuperar tu contraseña. 
                
                Visita este enlace para crear una nueva contraseña:
                ${resetLink}
                
                Este enlace expirará en 1 hora.
                
                Si no solicitaste este cambio, ignora este email.
                
                Saludos,
                555 Pilates Club
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de recuperación enviado exitosamente');
        console.log('   MessageId:', info.messageId);
        console.log('   Para:', email);
        console.log('   Desde:', process.env.EMAIL_USER);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar email:');
        console.error('   Tipo:', error.code || error.name);
        console.error('   Mensaje:', error.message);
        if (error.response) {
            console.error('   Respuesta:', error.response);
        }
        // No fallar el proceso si el email falla
        return false;
    }
};

module.exports = {
    enviarEmailRecuperacion,
};

