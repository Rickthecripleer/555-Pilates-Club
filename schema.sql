-- =====================================================
-- ESQUEMA DE BASE DE DATOS - PLATAFORMA ACADEMIA
-- Sistema de Gestión de Clases, Reservaciones y Pagos
-- =====================================================

-- Crear base de datos (opcional, descomentar si es necesario)
-- CREATE DATABASE IF NOT EXISTS academia_pilates;
-- USE academia_pilates;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'alumna') NOT NULL DEFAULT 'alumna',
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    creditos_disponibles INT NOT NULL DEFAULT 0,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_telefono (telefono),
    CHECK (creditos_disponibles >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: clases
-- =====================================================
CREATE TABLE IF NOT EXISTS clases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_clase VARCHAR(255) NOT NULL,
    descripcion TEXT,
    capacidad_maxima INT NOT NULL DEFAULT 10,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (capacidad_maxima > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: horarios
-- =====================================================
CREATE TABLE IF NOT EXISTS horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clase_id INT NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_clase_id (clase_id),
    INDEX idx_dia_semana (dia_semana),
    CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: reservaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS reservaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    horario_id INT NOT NULL,
    fecha_reserva DATE NOT NULL,
    estatus ENUM('confirmada', 'cancelada', 'completada', 'no_asistio') NOT NULL DEFAULT 'confirmada',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_horario_id (horario_id),
    INDEX idx_fecha_reserva (fecha_reserva),
    INDEX idx_estatus (estatus),
    -- Evitar reservaciones duplicadas para la misma alumna, horario y fecha
    UNIQUE KEY unique_reservacion (alumna_id, horario_id, fecha_reserva)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: pagos
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'otro') NOT NULL,
    tipo_plan ENUM('mensual', 'semanal', 'sesion', 'paquete', 'inscripcion') NOT NULL,
    estatus ENUM('completado', 'pendiente', 'cancelado') NOT NULL DEFAULT 'pendiente',
    comprobante_url VARCHAR(500) DEFAULT NULL,
    fecha_vencimiento_plan DATE DEFAULT NULL,
    descripcion TEXT,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_estatus (estatus),
    INDEX idx_tipo_plan (tipo_plan),
    INDEX idx_fecha_vencimiento (fecha_vencimiento_plan),
    CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VISTAS ÚTILES (Opcional)
-- =====================================================

-- Vista: Reservaciones con información completa
CREATE OR REPLACE VIEW vista_reservaciones_completas AS
SELECT 
    r.id AS reservacion_id,
    u.nombre AS alumna_nombre,
    u.email AS alumna_email,
    c.nombre_clase,
    h.dia_semana,
    h.hora_inicio,
    h.hora_fin,
    r.fecha_reserva,
    r.estatus AS estatus_reservacion,
    r.fecha_creacion
FROM reservaciones r
INNER JOIN usuarios u ON r.alumna_id = u.id
INNER JOIN horarios h ON r.horario_id = h.id
INNER JOIN clases c ON h.clase_id = c.id;

-- Vista: Pagos con información de alumnas
CREATE OR REPLACE VIEW vista_pagos_completos AS
SELECT 
    p.id AS pago_id,
    u.nombre AS alumna_nombre,
    u.email AS alumna_email,
    u.telefono AS alumna_telefono,
    p.monto,
    p.fecha_pago,
    p.metodo_pago,
    p.tipo_plan,
    p.estatus,
    p.comprobante_url,
    p.fecha_vencimiento_plan,
    p.descripcion,
    p.fecha_creacion
FROM pagos p
INNER JOIN usuarios u ON p.alumna_id = u.id;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para búsquedas frecuentes de reservaciones por fecha y estatus
CREATE INDEX idx_reservacion_fecha_estatus ON reservaciones(fecha_reserva, estatus);

-- Índice compuesto para búsquedas de pagos por alumna y estatus
CREATE INDEX idx_pago_alumna_estatus ON pagos(alumna_id, estatus);

-- =====================================================
-- TRIGGERS PARA LÓGICA DE NEGOCIO
-- =====================================================

-- Trigger: Descontar crédito cuando una reservación cambia a estatus 'no_asistio'
-- NOTA: Este trigger se ejecuta después de actualizar una reservación
-- y descuenta automáticamente un crédito de la alumna si el estatus es 'no_asistio'
DELIMITER $$

CREATE TRIGGER trg_descontar_credito_no_show
AFTER UPDATE ON reservaciones
FOR EACH ROW
BEGIN
    -- Si el estatus cambió a 'no_asistio' y antes no lo era
    IF NEW.estatus = 'no_asistio' AND (OLD.estatus IS NULL OR OLD.estatus != 'no_asistio') THEN
        -- Descontar un crédito de la alumna (solo si tiene créditos disponibles)
        UPDATE usuarios 
        SET creditos_disponibles = GREATEST(0, creditos_disponibles - 1)
        WHERE id = NEW.alumna_id AND creditos_disponibles > 0;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- COMENTARIOS SOBRE LÓGICA DE NEGOCIO
-- =====================================================

-- IMPORTANTE: Lógica de créditos y vencimientos
-- 
-- 1. CRÉDITOS DISPONIBLES:
--    - Se incrementan cuando se registra un pago con tipo_plan = 'paquete' o 'sesion'
--    - Se decrementan cuando una alumna hace una reservación confirmada
--    - Se decrementan automáticamente cuando una reservación cambia a 'no_asistio' (via trigger)
--    - Se validan antes de permitir nuevas reservaciones
--
-- 2. FECHA VENCIMIENTO:
--    - Se establece al crear/actualizar un pago según el tipo_plan:
--      * 'mensual': fecha_pago + 30 días
--      * 'semanal': fecha_pago + 7 días
--      * 'sesion': fecha_pago + 90 días (o según política)
--      * 'paquete': fecha_pago + X días (según cantidad de sesiones)
--    - Se usa para enviar recordatorios de cobro vía WhatsApp
--
-- 3. COMPROBANTE URL:
--    - Almacena la URL o ruta de la imagen del ticket de pago
--    - Permite al admin verificar pagos pendientes
--
-- 4. TIPO PLAN:
--    - 'mensual': Plan mensual ilimitado (no usa créditos)
--    - 'semanal': Plan semanal ilimitado (no usa créditos)
--    - 'sesion': Clase individual (usa 1 crédito)
--    - 'paquete': Múltiples clases (usa créditos según cantidad comprada)

