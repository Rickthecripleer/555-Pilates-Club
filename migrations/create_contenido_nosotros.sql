-- =====================================================
-- TABLA: contenido_nosotros
-- Almacena el contenido editable de la página "Sobre Nosotros"
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

-- Insertar contenido inicial por defecto
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

