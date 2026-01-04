/**
 * Script para generar hash de contraseñas
 * Uso: node scripts/hashPassword.js "mi_password"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('❌ Error: Debes proporcionar una contraseña');
    console.log('Uso: node scripts/hashPassword.js "mi_password"');
    process.exit(1);
}

(async () => {
    try {
        const hash = await bcrypt.hash(password, 10);
        console.log('\n✅ Hash generado exitosamente:\n');
        console.log(hash);
        console.log('\n📝 Copia este hash y úsalo en tu base de datos\n');
    } catch (error) {
        console.error('❌ Error al generar hash:', error.message);
        process.exit(1);
    }
})();









