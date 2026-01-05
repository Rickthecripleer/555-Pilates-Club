-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAR BASE DE DATOS MySQL
-- Ejecuta este script completo en tu base de datos MySQL (Railway o Aiven)
-- =====================================================

-- Usar la base de datos (Railway usa 'railway', Aiven usa 'defaultdb')
-- El script detectará automáticamente la base de datos desde las variables de entorno

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
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_telefono (telefono),
    INDEX idx_reset_token (reset_token),
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
    horarios_seleccionados JSON NULL,
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
-- TABLA: contenido_nosotros
-- =====================================================
CREATE TABLE IF NOT EXISTS contenido_nosotros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seccion VARCHAR(100) NOT NULL,
    campo VARCHAR(100) NOT NULL,
    tipo ENUM('texto', 'titulo', 'descripcion', 'imagen', 'lista') NOT NULL DEFAULT 'texto',
    contenido TEXT,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seccion_campo (seccion, campo),
    INDEX idx_seccion (seccion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: alumna_horarios_fijos
-- =====================================================
CREATE TABLE IF NOT EXISTS alumna_horarios_fijos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    pago_id INT NOT NULL,
    horario_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_alumna_horario_pago (alumna_id, horario_id, pago_id),
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_pago_id (pago_id),
    INDEX idx_horario_id (horario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cambios_horario_mensual
-- =====================================================
CREATE TABLE IF NOT EXISTS cambios_horario_mensual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumna_id INT NOT NULL,
    pago_id INT NOT NULL,
    horario_anterior_id INT NOT NULL,
    horario_nuevo_id INT NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NULL,
    FOREIGN KEY (alumna_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (horario_anterior_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (horario_nuevo_id) REFERENCES horarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_alumna_id (alumna_id),
    INDEX idx_pago_id (pago_id),
    INDEX idx_fecha_cambio (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERTAR CLASES
-- =====================================================
INSERT INTO clases (nombre_clase, descripcion, capacidad_maxima, activa) VALUES
('Pilates Mat', 'Clase de pilates en colchoneta', 11, TRUE),
('Pilates Sculpt', 'Clase de pilates con enfoque en tonificación', 11, TRUE),
('Pilates HIIT', 'Clase de pilates de alta intensidad', 11, TRUE)
ON DUPLICATE KEY UPDATE nombre_clase=nombre_clase;

-- =====================================================
-- INSERTAR HORARIOS
-- =====================================================
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
-- INSERTAR CONTENIDO INICIAL DE "SOBRE NOSOTROS"
-- =====================================================
INSERT INTO contenido_nosotros (seccion, campo, tipo, contenido, orden) VALUES
-- Hero Section
('hero', 'titulo', 'titulo', 'Sobre Nosotros', 1),
('hero', 'imagen', 'imagen', '/images/nosotros-hero.jpg', 2),

-- Introducción
('introduccion', 'titulo_principal', 'titulo', 'Descubre una nueva experiencia en Pilates', 1),
('introduccion', 'titulo_secundario', 'titulo', 'Un refugio de armonía y movimiento', 2),
('introduccion', 'imagen', 'imagen', '/images/nosotros-estudio.jpg', 3),
('introduccion', 'parrafo_1', 'texto', 'En nuestro estudio de Pilates ofrecemos una experiencia de bienestar integral basada en el método Pilates. Nos enfocamos en el movimiento consciente, la armonía corporal y el crecimiento personal, dentro de un ambiente sofisticado, cálido y lleno de intención.', 4),
('introduccion', 'parrafo_2', 'texto', 'Nuestra misión es acompañarte en el camino hacia una conexión profunda entre cuerpo, mente y esencia, a través de atención personalizada, profesionalismo y espacios que invitan al equilibrio. Cultivamos el detalle, la empatía y la inclusión.', 5),
('introduccion', 'lista_item_1', 'texto', 'Trasciende lo físico y lo mental', 6),
('introduccion', 'lista_item_2', 'texto', 'Descubre la esencia del movimiento', 7),
('introduccion', 'lista_item_3', 'texto', 'Vive la sutileza del equilibrio', 8),

-- Sección Clases
('clases', 'titulo', 'titulo', 'Nuestras Clases', 1),
('clases', 'subtitulo', 'texto', 'Descubre las diferentes modalidades que ofrecemos', 2),
('clases', 'clase_1_nombre', 'titulo', 'Pilates Mat', 3),
('clases', 'clase_1_descripcion', 'descripcion', 'Clase de pilates en colchoneta. Fortalece tu centro, mejora la postura y desarrolla flexibilidad a través de movimientos controlados y precisos.', 4),
('clases', 'clase_1_horarios', 'texto', '7:00 AM, 8:00 AM, 7:00 PM', 5),
('clases', 'clase_2_nombre', 'titulo', 'Pilates Sculpt', 6),
('clases', 'clase_2_descripcion', 'descripcion', 'Clase de pilates con enfoque en tonificación. Trabaja músculos profundos de forma segura, aumentando fuerza y definición muscular.', 7),
('clases', 'clase_2_horarios', 'texto', '9:00 AM', 8),
('clases', 'clase_3_nombre', 'titulo', 'Pilates HIIT', 9),
('clases', 'clase_3_descripcion', 'descripcion', 'Clase de pilates de alta intensidad. Combina movimientos de pilates con intervalos de alta intensidad para maximizar el gasto calórico.', 10),
('clases', 'clase_3_horarios', 'texto', '6:00 PM', 11),

-- Sección Características
('caracteristicas', 'titulo', 'titulo', 'Refinamiento para cuerpo y mente', 1),
('caracteristicas', 'subtitulo', 'texto', 'Armonía, movimiento y equilibrio en nuestro estudio', 2),
('caracteristicas', 'item_1_titulo', 'titulo', 'Pet Friendly', 3),
('caracteristicas', 'item_1_descripcion', 'texto', 'Bienvenimos a tus compañeros peludos', 4),
('caracteristicas', 'item_2_titulo', 'titulo', 'Espacio Instagrameable', 5),
('caracteristicas', 'item_2_descripcion', 'texto', 'Diseñado para capturar momentos especiales', 6),
('caracteristicas', 'item_3_titulo', 'titulo', 'Bebidas & Relax', 7),
('caracteristicas', 'item_3_descripcion', 'texto', 'Espacio para relajarte después de tu sesión', 8),
('caracteristicas', 'item_4_titulo', 'titulo', 'Lockers', 9),
('caracteristicas', 'item_4_descripcion', 'texto', 'Guardarropa seguro para tus pertenencias', 10),

-- Sección Valores
('valores', 'titulo', 'titulo', 'Nuestros Valores', 1),
('valores', 'subtitulo', 'texto', 'Conecta contigo, transforma tu cuerpo y eleva tu esencia', 2),
('valores', 'valor_1_titulo', 'titulo', 'Profesionalismo', 3),
('valores', 'valor_1_descripcion', 'texto', 'Instructores certificados y comprometidos con tu bienestar', 4),
('valores', 'valor_2_titulo', 'titulo', 'Empatía', 5),
('valores', 'valor_2_descripcion', 'texto', 'Entendemos y respetamos tu proceso personal', 6),
('valores', 'valor_3_titulo', 'titulo', 'Equilibrio', 7),
('valores', 'valor_3_descripcion', 'texto', 'Armonía entre cuerpo, mente y espíritu', 8),
('valores', 'valor_4_titulo', 'titulo', 'Inclusividad', 9),
('valores', 'valor_4_descripcion', 'texto', 'Un espacio abierto y acogedor para todos', 10),
('valores', 'valor_5_titulo', 'titulo', 'Honestidad', 11),
('valores', 'valor_5_descripcion', 'texto', 'Transparencia y autenticidad en cada interacción', 12),
('valores', 'valor_6_titulo', 'titulo', 'Atención al Cliente', 13),
('valores', 'valor_6_descripcion', 'texto', 'Tu bienestar es nuestra prioridad', 14)
ON DUPLICATE KEY UPDATE contenido = VALUES(contenido);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT '✅ Base de datos configurada correctamente' AS mensaje;
SELECT COUNT(*) AS total_clases FROM clases;
SELECT COUNT(*) AS total_horarios FROM horarios;
SELECT COUNT(*) AS total_contenido FROM contenido_nosotros;

