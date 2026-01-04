-- =====================================================
-- CONVERTIR CAMPO horarios_seleccionados A TIPO JSON
-- (Opcional - solo si quieres el tipo JSON nativo)
-- =====================================================

USE academia_pilates;

-- Convertir el campo a tipo JSON (si es compatible con tu versión de MySQL/MariaDB)
-- Nota: Esto solo funciona en MySQL 5.7+ o MariaDB 10.2.7+
-- Si tu versión no soporta JSON nativo, el campo quedará como longtext (funciona igual)

-- Verificar versión primero
SELECT VERSION() as version_mysql;

-- Intentar convertir a JSON
ALTER TABLE pagos 
MODIFY COLUMN horarios_seleccionados JSON NULL COMMENT 'Horarios seleccionados por la alumna (se usan al aprobar el pago)';

-- Si da error, el campo quedará como longtext (no es problema, funciona igual)

-- Verificar
SELECT '✅ Campo horarios_seleccionados verificado' AS mensaje;


