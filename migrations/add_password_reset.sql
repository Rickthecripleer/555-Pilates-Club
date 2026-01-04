-- =====================================================
-- MIGRACIÓN: Agregar campos de recuperación de contraseña
-- =====================================================

USE academia_pilates;

-- Agregar campos para recuperación de contraseña
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL,
ADD INDEX idx_reset_token (reset_token);



