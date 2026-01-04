-- =====================================================
-- AGREGAR CAMPO PARA HORARIOS SELECCIONADOS EN PAGOS
-- =====================================================

USE academia_pilates;

-- Agregar campo JSON para almacenar horarios seleccionados temporalmente
ALTER TABLE pagos 
ADD COLUMN IF NOT EXISTS horarios_seleccionados JSON NULL COMMENT 'Horarios seleccionados por la alumna (se usan al aprobar el pago)';

-- Verificar
SELECT '✅ Campo horarios_seleccionados agregado a la tabla pagos' AS mensaje;


