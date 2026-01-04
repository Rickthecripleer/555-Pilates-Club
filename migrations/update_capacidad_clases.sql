-- =====================================================
-- ACTUALIZAR CAPACIDAD MÁXIMA DE CLASES A 11
-- =====================================================

USE academia_pilates;

-- Actualizar capacidad máxima de todas las clases a 11
UPDATE clases 
SET capacidad_maxima = 11 
WHERE capacidad_maxima != 11;

-- Verificar
SELECT '✅ Capacidad de clases actualizada a 11' AS mensaje;
SELECT nombre_clase, capacidad_maxima 
FROM clases 
ORDER BY nombre_clase;


