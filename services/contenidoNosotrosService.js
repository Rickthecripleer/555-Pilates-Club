const { query } = require('../config/database');

/**
 * Obtener todo el contenido de la página "Sobre Nosotros"
 */
const obtenerContenido = async () => {
    try {
        // Verificar y crear la tabla si no existe
        await verificarYCrearTabla();

        const resultados = await query(
            `SELECT seccion, campo, tipo, contenido, orden 
             FROM contenido_nosotros 
             WHERE activo = TRUE 
             ORDER BY seccion, orden ASC`
        );

        // Organizar el contenido por secciones
        const contenido = {};
        resultados.forEach(row => {
            if (!contenido[row.seccion]) {
                contenido[row.seccion] = {};
            }
            contenido[row.seccion][row.campo] = {
                tipo: row.tipo,
                contenido: row.contenido,
                orden: row.orden
            };
        });

        return contenido;
    } catch (error) {
        console.error('Error al obtener contenido:', error);
        throw error;
    }
};

/**
 * Obtener contenido de una sección específica
 */
const obtenerContenidoPorSeccion = async (seccion) => {
    try {
        const resultados = await query(
            `SELECT campo, tipo, contenido, orden 
             FROM contenido_nosotros 
             WHERE seccion = ? AND activo = TRUE 
             ORDER BY orden ASC`,
            [seccion]
        );

        const contenido = {};
        resultados.forEach(row => {
            contenido[row.campo] = {
                tipo: row.tipo,
                contenido: row.contenido,
                orden: row.orden
            };
        });

        return contenido;
    } catch (error) {
        console.error('Error al obtener contenido por sección:', error);
        throw error;
    }
};

/**
 * Verificar y crear la tabla si no existe
 */
const verificarYCrearTabla = async () => {
    try {
        await query('SELECT 1 FROM contenido_nosotros LIMIT 1');
        return true; // La tabla existe
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('⚠️  La tabla contenido_nosotros no existe. Creándola...');
            
            // Crear la tabla
            await query(`
                CREATE TABLE IF NOT EXISTS contenido_nosotros (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    seccion VARCHAR(100) NOT NULL,
                    campo VARCHAR(100) NOT NULL,
                    tipo ENUM('texto', 'titulo', 'descripcion', 'imagen', 'lista') NOT NULL DEFAULT 'texto',
                    contenido TEXT,
                    orden INT DEFAULT 0,
                    activo BOOLEAN DEFAULT TRUE,
                    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_seccion_campo (seccion, campo),
                    INDEX idx_seccion (seccion),
                    INDEX idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tabla contenido_nosotros creada exitosamente');
            return true;
        }
        throw error;
    }
};

/**
 * Actualizar contenido de una sección
 */
const actualizarContenido = async (seccion, campo, nuevoContenido) => {
    try {
        // Verificar y crear la tabla si no existe
        await verificarYCrearTabla();

        const resultado = await query(
            `UPDATE contenido_nosotros 
             SET contenido = ?, fecha_actualizacion = NOW() 
             WHERE seccion = ? AND campo = ?`,
            [nuevoContenido, seccion, campo]
        );

        if (resultado.affectedRows === 0) {
            // Si no existe, crear el registro
            await query(
                `INSERT INTO contenido_nosotros (seccion, campo, tipo, contenido, orden) 
                 VALUES (?, ?, 'texto', ?, 0)`,
                [seccion, campo, nuevoContenido]
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar contenido:', error);
        throw error;
    }
};

/**
 * Actualizar múltiples campos de contenido
 */
const actualizarContenidoMultiple = async (actualizaciones) => {
    try {
        const promesas = actualizaciones.map(update => {
            return query(
                `UPDATE contenido_nosotros 
                 SET contenido = ?, fecha_actualizacion = NOW() 
                 WHERE seccion = ? AND campo = ?`,
                [update.contenido, update.seccion, update.campo]
            );
        });

        await Promise.all(promesas);
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar contenido múltiple:', error);
        throw error;
    }
};

module.exports = {
    obtenerContenido,
    obtenerContenidoPorSeccion,
    actualizarContenido,
    actualizarContenidoMultiple,
    verificarYCrearTabla
};

