-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A TABLA RESERVACIONES
-- =====================================================

-- Agregar columna es_automatica si no existe
ALTER TABLE reservaciones 
ADD COLUMN IF NOT EXISTS es_automatica BOOLEAN DEFAULT FALSE;

-- Agregar columna horario_fijo_id si no existe
ALTER TABLE reservaciones 
ADD COLUMN IF NOT EXISTS horario_fijo_id INT NULL;

-- Agregar foreign key si no existe (solo si la tabla alumna_horarios_fijos existe)
-- Si la tabla no existe, esta línea fallará pero no afectará las columnas
ALTER TABLE reservaciones 
ADD CONSTRAINT IF NOT EXISTS fk_reservaciones_horario_fijo 
FOREIGN KEY (horario_fijo_id) REFERENCES alumna_horarios_fijos(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar índices si no existen
ALTER TABLE reservaciones 
ADD INDEX IF NOT EXISTS idx_es_automatica (es_automatica);

ALTER TABLE reservaciones 
ADD INDEX IF NOT EXISTS idx_horario_fijo_id (horario_fijo_id);

-- Verificar
SELECT '✅ Columnas agregadas correctamente' AS mensaje;

