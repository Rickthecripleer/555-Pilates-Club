-- =====================================================
-- ACTUALIZACIÓN DE CLASES Y HORARIOS
-- Según nuevas reglas de negocio
-- =====================================================

USE academia_pilates;

-- PASO 0: Deshabilitar temporalmente las claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- PASO 1: Eliminar reservaciones existentes (dependen de horarios)
DELETE FROM reservaciones;

-- PASO 2: Limpiar horarios existentes
DELETE FROM horarios;

-- PASO 3: Limpiar clases existentes
DELETE FROM clases;

-- PASO 4: Reactivar las claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- PASO 5: Insertar las 3 clases permitidas
INSERT INTO clases (nombre_clase, descripcion, capacidad_maxima, activa) VALUES
('Pilates Mat', 'Clase de pilates en colchoneta', 11, TRUE),
('Pilates Sculpt', 'Clase de pilates con enfoque en tonificación', 11, TRUE),
('Pilates HIIT', 'Clase de pilates de alta intensidad', 11, TRUE);

-- PASO 6: Insertar horarios según especificación (Lunes a Viernes únicamente)
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

-- Verificar
SELECT '✅ Clases y horarios actualizados correctamente' AS mensaje;
SELECT nombre_clase, COUNT(*) as total_horarios 
FROM clases c
LEFT JOIN horarios h ON c.id = h.clase_id
GROUP BY c.id, nombre_clase;

