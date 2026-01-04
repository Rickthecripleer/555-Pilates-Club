-- =====================================================
-- SCRIPT DE REINICIO DE BASE DE DATOS
-- Limpia todos los registros pero mantiene la estructura
-- y los datos esenciales (clases, horarios)
-- =====================================================

USE academia_pilates;

-- Deshabilitar temporalmente las claves foráneas para poder eliminar datos
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PASO 1: Eliminar todas las transacciones y datos de usuarios
-- =====================================================

-- Eliminar reservaciones
DELETE FROM reservaciones;
ALTER TABLE reservaciones AUTO_INCREMENT = 1;

-- Eliminar pagos
DELETE FROM pagos;
ALTER TABLE pagos AUTO_INCREMENT = 1;

-- Eliminar horarios fijos de alumnas (si la tabla existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema = DATABASE() 
               AND table_name = 'alumna_horarios_fijos');
SET @sql = IF(@exists > 0, 
    'DELETE FROM alumna_horarios_fijos; ALTER TABLE alumna_horarios_fijos AUTO_INCREMENT = 1;', 
    'SELECT 1 AS "Tabla alumna_horarios_fijos no existe, omitiendo";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar cambios de horario (si la tabla existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema = DATABASE() 
               AND table_name = 'cambios_horario_mensual');
SET @sql = IF(@exists > 0, 
    'DELETE FROM cambios_horario_mensual; ALTER TABLE cambios_horario_mensual AUTO_INCREMENT = 1;', 
    'SELECT 1 AS "Tabla cambios_horario_mensual no existe, omitiendo";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Limpiar tokens de recuperación de contraseña (están en la tabla usuarios)
UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL;

-- Limpiar horarios_seleccionados de pagos (se elimina automáticamente al eliminar los pagos)

-- =====================================================
-- PASO 2: Eliminar todos los usuarios (incluyendo admins)
-- =====================================================

DELETE FROM usuarios;
ALTER TABLE usuarios AUTO_INCREMENT = 1;

-- =====================================================
-- PASO 3: Limpiar y recrear clases y horarios
-- =====================================================

-- Eliminar horarios existentes
DELETE FROM horarios;
ALTER TABLE horarios AUTO_INCREMENT = 1;

-- Eliminar clases existentes
DELETE FROM clases;
ALTER TABLE clases AUTO_INCREMENT = 1;

-- Insertar las 3 clases permitidas
INSERT INTO clases (nombre_clase, descripcion, capacidad_maxima, activa) VALUES
('Pilates Mat', 'Clase de pilates en colchoneta', 11, TRUE),
('Pilates Sculpt', 'Clase de pilates con enfoque en tonificación', 11, TRUE),
('Pilates HIIT', 'Clase de pilates de alta intensidad', 11, TRUE);

-- Insertar horarios según especificación (Lunes a Viernes únicamente)
-- 7:00 AM - Pilates Mat
INSERT INTO horarios (clase_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'lunes', '07:00:00', '08:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'martes', '07:00:00', '08:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'miercoles', '07:00:00', '08:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'jueves', '07:00:00', '08:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'viernes', '07:00:00', '08:00:00', TRUE);

-- 8:00 AM - Pilates Mat
INSERT INTO horarios (clase_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'lunes', '08:00:00', '09:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'martes', '08:00:00', '09:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'miercoles', '08:00:00', '09:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'jueves', '08:00:00', '09:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'viernes', '08:00:00', '09:00:00', TRUE);

-- 9:00 AM - Pilates Sculpt
INSERT INTO horarios (clase_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Sculpt'), 'lunes', '09:00:00', '10:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Sculpt'), 'martes', '09:00:00', '10:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Sculpt'), 'miercoles', '09:00:00', '10:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Sculpt'), 'jueves', '09:00:00', '10:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Sculpt'), 'viernes', '09:00:00', '10:00:00', TRUE);

-- 6:00 PM (18:00) - Pilates HIIT
INSERT INTO horarios (clase_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
((SELECT id FROM clases WHERE nombre_clase = 'Pilates HIIT'), 'lunes', '18:00:00', '19:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates HIIT'), 'martes', '18:00:00', '19:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates HIIT'), 'miercoles', '18:00:00', '19:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates HIIT'), 'jueves', '18:00:00', '19:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates HIIT'), 'viernes', '18:00:00', '19:00:00', TRUE);

-- 7:00 PM (19:00) - Pilates Mat
INSERT INTO horarios (clase_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'lunes', '19:00:00', '20:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'martes', '19:00:00', '20:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'miercoles', '19:00:00', '20:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'jueves', '19:00:00', '20:00:00', TRUE),
((SELECT id FROM clases WHERE nombre_clase = 'Pilates Mat'), 'viernes', '19:00:00', '20:00:00', TRUE);

-- =====================================================
-- PASO 4: Limpiar contenido_nosotros (opcional - mantener estructura)
-- =====================================================

-- Eliminar contenido personalizado pero mantener la estructura
-- Si quieres mantener el contenido por defecto, comenta las siguientes líneas:
-- DELETE FROM contenido_nosotros;

-- O si quieres resetear a valores por defecto, descomenta y ejecuta:
-- (Esto se puede hacer ejecutando create_contenido_nosotros.sql después)

-- =====================================================
-- PASO 5: Reactivar las claves foráneas
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT '✅ Base de datos reiniciada correctamente' AS mensaje;

SELECT '📊 Resumen:' AS titulo;
SELECT 
    'Usuarios' AS tabla, 
    COUNT(*) AS registros 
FROM usuarios
UNION ALL
SELECT 
    'Clases', 
    COUNT(*) 
FROM clases
UNION ALL
SELECT 
    'Horarios', 
    COUNT(*) 
FROM horarios
UNION ALL
SELECT 
    'Reservaciones', 
    COUNT(*) 
FROM reservaciones
UNION ALL
SELECT 
    'Pagos', 
    COUNT(*) 
FROM pagos;

SELECT '📋 Clases creadas:' AS titulo;
SELECT id, nombre_clase, capacidad_maxima, activa FROM clases;

SELECT '⏰ Horarios creados:' AS titulo;
SELECT 
    h.id,
    c.nombre_clase,
    h.dia_semana,
    h.hora_inicio,
    h.hora_fin
FROM horarios h
INNER JOIN clases c ON h.clase_id = c.id
ORDER BY c.nombre_clase, h.dia_semana, h.hora_inicio;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Después de ejecutar este script, necesitarás:
-- 1. Crear un nuevo usuario admin desde el sistema o directamente en la BD
-- 2. El contenido de "Sobre Nosotros" se mantiene (si no lo eliminaste)
--    o puedes ejecutar create_contenido_nosotros.sql para resetearlo
-- =====================================================

