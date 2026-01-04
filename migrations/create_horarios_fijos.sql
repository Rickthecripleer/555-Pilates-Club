-- =====================================================
-- CREAR TABLA PARA HORARIOS FIJOS ASIGNADOS
-- Sistema de inscripción a horarios fijos
-- =====================================================

USE academia_pilates;

-- Tabla para almacenar horarios fijos asignados a alumnas
CREATE TABLE IF NOT EXISTS alumna_horarios_fijos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    pago_id INT NOT NULL,
    horario_id INT NOT NULL,
    tipo_plan ENUM('mensual', 'semanal') NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_pago_id (pago_id),
    INDEX idx_horario_id (horario_id),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar campo para indicar si las reservaciones fueron creadas automáticamente
ALTER TABLE reservaciones 
ADD COLUMN IF NOT EXISTS es_automatica BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS horario_fijo_id INT NULL,
ADD FOREIGN KEY (horario_fijo_id) REFERENCES alumna_horarios_fijos(id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD INDEX idx_es_automatica (es_automatica),
ADD INDEX idx_horario_fijo_id (horario_fijo_id);

-- Verificar
SELECT '✅ Tabla de horarios fijos creada correctamente' AS mensaje;

