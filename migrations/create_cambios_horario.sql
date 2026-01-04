-- =====================================================
-- CREAR TABLA PARA RASTREAR CAMBIOS DE HORARIO
-- Sistema de control de cambios de horario para mensualidad
-- =====================================================

USE academia_pilates;

-- Tabla para rastrear cambios de horario de alumnas con mensualidad
CREATE TABLE IF NOT EXISTS cambios_horario_mensual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    pago_id INT NOT NULL,
    horario_anterior_id INT NOT NULL,
    horario_nuevo_id INT NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NULL,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (horario_anterior_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (horario_nuevo_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_pago_id (pago_id),
    INDEX idx_fecha_cambio (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Tabla de cambios de horario creada correctamente' AS mensaje;


