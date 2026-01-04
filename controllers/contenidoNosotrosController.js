const contenidoNosotrosService = require('../services/contenidoNosotrosService');
const uploadContenidoConfig = require('../config/uploadContenido');
const path = require('path');

/**
 * GET /api/contenido/nosotros
 * Obtener todo el contenido de la página "Sobre Nosotros"
 * Accesible para todos los usuarios autenticados
 */
const obtenerContenido = async (req, res) => {
    try {
        const contenido = await contenidoNosotrosService.obtenerContenido();
        
        res.json({
            success: true,
            data: contenido
        });
    } catch (error) {
        console.error('Error en obtenerContenido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el contenido',
            error: error.message
        });
    }
};

/**
 * GET /api/contenido/nosotros/:seccion
 * Obtener contenido de una sección específica
 */
const obtenerContenidoPorSeccion = async (req, res) => {
    try {
        const { seccion } = req.params;
        const contenido = await contenidoNosotrosService.obtenerContenidoPorSeccion(seccion);
        
        res.json({
            success: true,
            data: contenido
        });
    } catch (error) {
        console.error('Error en obtenerContenidoPorSeccion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el contenido de la sección',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/contenido/nosotros
 * Actualizar contenido (solo admin)
 */
const actualizarContenido = async (req, res) => {
    try {
        const { seccion, campo, contenido } = req.body;

        if (!seccion || !campo || contenido === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren sección, campo y contenido'
            });
        }

        await contenidoNosotrosService.actualizarContenido(seccion, campo, contenido);
        
        res.json({
            success: true,
            message: 'Contenido actualizado correctamente'
        });
    } catch (error) {
        console.error('Error en actualizarContenido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el contenido',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/contenido/nosotros/multiple
 * Actualizar múltiples campos de contenido (solo admin)
 */
const actualizarContenidoMultiple = async (req, res) => {
    try {
        const { actualizaciones } = req.body;

        if (!Array.isArray(actualizaciones) || actualizaciones.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de actualizaciones'
            });
        }

        // Validar que cada actualización tenga los campos necesarios
        for (const update of actualizaciones) {
            if (!update.seccion || !update.campo || update.contenido === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Cada actualización debe tener sección, campo y contenido'
                });
            }
        }

        await contenidoNosotrosService.actualizarContenidoMultiple(actualizaciones);
        
        res.json({
            success: true,
            message: 'Contenido actualizado correctamente'
        });
    } catch (error) {
        console.error('Error en actualizarContenidoMultiple:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el contenido',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/contenido/nosotros/imagen
 * Subir imagen para contenido (solo admin)
 */
const subirImagen = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        const { seccion, campo } = req.body;

        if (!seccion || !campo) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren sección y campo'
            });
        }

        // Construir la URL de la imagen
        const imageUrl = `/uploads/contenido/${req.file.filename}`;

        // Guardar la URL en la base de datos
        await contenidoNosotrosService.actualizarContenido(seccion, campo, imageUrl);

        res.json({
            success: true,
            message: 'Imagen subida correctamente',
            data: {
                url: imageUrl,
                filename: req.file.filename
            }
        });
    } catch (error) {
        console.error('Error en subirImagen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir la imagen',
            error: error.message
        });
    }
};

module.exports = {
    obtenerContenido,
    obtenerContenidoPorSeccion,
    actualizarContenido,
    actualizarContenidoMultiple,
    subirImagen,
    uploadContenido: uploadContenidoConfig.single('imagen')
};

