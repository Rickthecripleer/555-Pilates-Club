-- =====================================================
-- MIGRACIÓN: Agregar 'inscripcion' al ENUM tipo_plan
-- =====================================================
-- Esta migración agrega 'inscripcion' como opción válida
-- en el ENUM tipo_plan de la tabla pagos

USE pilates_club;

-- Modificar el ENUM para incluir 'inscripcion'
ALTER TABLE pagos 
MODIFY COLUMN tipo_plan ENUM('mensual', 'semanal', 'sesion', 'paquete', 'inscripcion') NOT NULL;

-- Verificar que el cambio se aplicó correctamente
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'pilates_club' 
  AND TABLE_NAME = 'pagos' 
  AND COLUMN_NAME = 'tipo_plan';



