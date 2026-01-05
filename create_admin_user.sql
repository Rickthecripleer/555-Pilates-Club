-- =====================================================
-- CREAR USUARIO ADMINISTRADOR
-- Ejecuta este script en tu base de datos MySQL de Aiven
-- =====================================================

USE defaultdb;

-- Insertar usuario administrador
INSERT INTO usuarios (email, password, rol, nombre, activo) 
VALUES (
  'Moralesterron1995@outlook.es',
  '$2a$10$ZnPn4ca0c.9tBAprp.AX0eVzISio19OxxkL/qRVtkYj5QIhSgUhty',
  'admin',
  'Sodelva Guadalupe Morales Terrón',
  TRUE
)
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  nombre = VALUES(nombre),
  rol = 'admin',
  activo = TRUE;

-- Verificar que se creó correctamente
SELECT 
  id,
  nombre,
  email,
  rol,
  activo,
  fecha_registro
FROM usuarios 
WHERE email = 'Moralesterron1995@outlook.es';

SELECT '✅ Usuario administrador creado correctamente' AS mensaje;

