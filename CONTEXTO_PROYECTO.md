# 📋 CONTEXTO COMPLETO DEL PROYECTO - PLATAFORMA ACADEMIA DE PILATES

## 🎯 OBJETIVO DEL PROYECTO

Desarrollar una plataforma web de administración para una academia de pilates con sistema de reservaciones, gestión de pagos y control de planes. El sistema maneja dos tipos de usuarios: **Administradores** (gestión total) y **Alumnas** (reservar y pagar).

---

## 📊 ESQUEMA DE BASE DE DATOS (MySQL)

### Tablas Principales

#### 1. **usuarios**
Gestiona tanto administradores como alumnas.

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT)
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `password` (VARCHAR 255, NOT NULL) - Hasheado con bcrypt
- `rol` (ENUM: 'admin', 'alumna', NOT NULL, DEFAULT 'alumna')
- `nombre` (VARCHAR 255, NOT NULL)
- `telefono` (VARCHAR 20) - Para recordatorios de WhatsApp
- `creditos_disponibles` (INT, NOT NULL, DEFAULT 0) - Control de clases restantes
- `fecha_registro` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `activo` (BOOLEAN, DEFAULT TRUE)

**Índices:** email, rol, telefono
**Constraint:** creditos_disponibles >= 0

#### 2. **clases**
Catálogo de clases disponibles.

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT)
- `nombre_clase` (VARCHAR 255, NOT NULL)
- `descripcion` (TEXT)
- `capacidad_maxima` (INT, NOT NULL, DEFAULT 10)
- `activa` (BOOLEAN, DEFAULT TRUE)
- `fecha_creacion` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Constraint:** capacidad_maxima > 0

#### 3. **horarios**
Horarios de cada clase por día de la semana.

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT)
- `clase_id` (INT, FK → clases.id)
- `dia_semana` (ENUM: 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
- `hora_inicio` (TIME, NOT NULL)
- `hora_fin` (TIME, NOT NULL)
- `activo` (BOOLEAN, DEFAULT TRUE)
- `fecha_creacion` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**FK:** clase_id → clases(id) ON DELETE RESTRICT
**Índices:** clase_id, dia_semana
**Constraint:** hora_fin > hora_inicio

#### 4. **reservaciones**
Reservaciones de alumnas para clases específicas.

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT)
- `alumna_id` (INT, FK → usuarios.id)
- `horario_id` (INT, FK → horarios.id)
- `fecha_reserva` (DATE, NOT NULL)
- `estatus` (ENUM: 'confirmada', 'cancelada', 'completada', 'no_asistio', DEFAULT 'confirmada')
- `fecha_creacion` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `fecha_actualizacion` (DATETIME, ON UPDATE CURRENT_TIMESTAMP)

**FKs:** 
- alumna_id → usuarios(id) ON DELETE RESTRICT
- horario_id → horarios(id) ON DELETE RESTRICT

**Índices:** alumna_id, horario_id, fecha_reserva, estatus
**UNIQUE:** (alumna_id, horario_id, fecha_reserva) - Evita reservaciones duplicadas

#### 5. **pagos**
Registro de pagos realizados por las alumnas.

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT)
- `alumna_id` (INT, FK → usuarios.id)
- `monto` (DECIMAL 10,2, NOT NULL)
- `fecha_pago` (DATE, NOT NULL)
- `metodo_pago` (ENUM: 'efectivo', 'tarjeta', 'transferencia', 'otro')
- `tipo_plan` (ENUM: 'mensual', 'semanal', 'sesion', 'paquete', NOT NULL)
- `estatus` (ENUM: 'completado', 'pendiente', 'cancelado', DEFAULT 'pendiente')
- `comprobante_url` (VARCHAR 500) - URL/ruta de la foto del ticket
- `fecha_vencimiento_plan` (DATE) - Para recordatorios de cobro
- `descripcion` (TEXT)
- `fecha_creacion` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `fecha_actualizacion` (DATETIME, ON UPDATE CURRENT_TIMESTAMP)

**FK:** alumna_id → usuarios(id) ON DELETE RESTRICT
**Índices:** alumna_id, fecha_pago, estatus, tipo_plan, fecha_vencimiento_plan
**Constraint:** monto > 0

### Triggers SQL

#### **trg_descontar_credito_no_show**
Trigger que se ejecuta automáticamente cuando una reservación cambia a estatus 'no_asistio'. Descuenta 1 crédito de la alumna (solo si tiene créditos disponibles).

```sql
CREATE TRIGGER trg_descontar_credito_no_show
AFTER UPDATE ON reservaciones
FOR EACH ROW
BEGIN
    IF NEW.estatus = 'no_asistio' AND (OLD.estatus IS NULL OR OLD.estatus != 'no_asistio') THEN
        UPDATE usuarios 
        SET creditos_disponibles = GREATEST(0, creditos_disponibles - 1)
        WHERE id = NEW.alumna_id AND creditos_disponibles > 0;
    END IF;
END
```

### Vistas

1. **vista_reservaciones_completas**: JOIN de reservaciones con usuarios, horarios y clases
2. **vista_pagos_completos**: JOIN de pagos con usuarios

---

## 🏗️ ARQUITECTURA DEL BACKEND

### Stack Tecnológico

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MySQL (mysql2)
- **Autenticación:** JWT (jsonwebtoken)
- **Hashing:** bcryptjs
- **Validación:** express-validator
- **Upload de Archivos:** multer
- **CORS:** habilitado

### Estructura de Carpetas

```
PILATES/
├── config/
│   ├── database.js          # Pool de conexiones MySQL
│   └── upload.js            # Configuración Multer (imágenes, máx 5MB)
├── controllers/
│   ├── authController.js    # Login y perfil de usuario
│   ├── claseController.js   # Endpoints de clases
│   ├── reservacionController.js  # Endpoints de reservaciones
│   └── pagoController.js    # Endpoints de pagos
├── middleware/
│   ├── auth.js              # JWT authentication + autorización por roles
│   └── validation.js        # Validaciones con express-validator
├── routes/
│   ├── authRoutes.js        # /api/auth/*
│   ├── claseRoutes.js       # /api/clases/*
│   ├── reservacionRoutes.js # /api/reservaciones/*
│   └── pagoRoutes.js        # /api/pagos/*
├── services/
│   ├── claseService.js      # Lógica de negocio - Clases
│   ├── reservacionService.js # Lógica de negocio - Reservaciones
│   └── pagoService.js       # Lógica de negocio - Pagos
├── scripts/
│   └── hashPassword.js      # Script para generar hashes bcrypt
├── uploads/
│   └── comprobantes/        # Archivos subidos (comprobantes)
├── server.js                # Servidor Express principal
├── package.json
├── schema.sql               # Esquema completo de BD
├── seed.sql                 # Datos de prueba
└── README.md                # Documentación
```

---

## 🔌 ENDPOINTS IMPLEMENTADOS

### Autenticación

#### `POST /api/auth/login`
Iniciar sesión (público).

**Body:**
```json
{
  "email": "alumna@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "alumna@example.com",
      "rol": "alumna",
      "nombre": "María García",
      "creditos_disponibles": 5
    }
  }
}
```

#### `GET /api/auth/me`
Obtener información del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

---

### Clases

#### `GET /api/clases/disponibles`
Obtener clases disponibles filtradas por horario.

**Query Parameters:**
- `dia_semana` (opcional): lunes, martes, miercoles, etc.
- `hora_inicio` (opcional): HH:MM:SS
- `hora_fin` (opcional): HH:MM:SS
- `fecha` (opcional): YYYY-MM-DD

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "clase_id": 1,
      "nombre_clase": "Pilates Mat",
      "descripcion": "Clase de pilates en colchoneta",
      "capacidad_maxima": 10,
      "horario_id": 1,
      "dia_semana": "lunes",
      "hora_inicio": "09:00:00",
      "hora_fin": "10:00:00",
      "reservaciones_actuales": 3,
      "lugares_disponibles": 7
    }
  ],
  "total": 1
}
```

---

### Reservaciones

#### `GET /api/reservaciones/verificar-acceso`
Verificar si la alumna tiene acceso para reservar (requiere autenticación + rol alumna).

**Response:**
```json
{
  "success": true,
  "data": {
    "tieneAcceso": true,
    "creditos": 5,
    "tienePlanActivo": false,
    "tipoPlan": null,
    "motivo": "Acceso permitido"
  }
}
```

#### `GET /api/reservaciones/mis-reservaciones`
Obtener reservaciones de la alumna autenticada.

**Query Parameters:**
- `estatus` (opcional): confirmada, cancelada, completada, no_asistio
- `fecha_desde` (opcional): YYYY-MM-DD
- `fecha_hasta` (opcional): YYYY-MM-DD

#### `POST /api/reservaciones`
Crear una nueva reservación (requiere autenticación + rol alumna).

**Body:**
```json
{
  "horario_id": 1,
  "fecha_reserva": "2024-01-15"
}
```

**Validaciones:**
- `horario_id` debe ser un entero válido
- `fecha_reserva` debe ser una fecha válida (ISO8601)
- No se pueden hacer reservaciones para fechas pasadas
- Verifica que tenga créditos o plan activo
- Verifica disponibilidad de lugares
- Previene reservaciones duplicadas

**Response:**
```json
{
  "success": true,
  "message": "Reservación creada exitosamente",
  "data": {
    "id": 1,
    "alumna_id": 1,
    "horario_id": 1,
    "fecha_reserva": "2024-01-15",
    "estatus": "confirmada",
    "nombre_clase": "Pilates Mat",
    "dia_semana": "lunes",
    "hora_inicio": "09:00:00",
    "hora_fin": "10:00:00"
  }
}
```

---

### Pagos

#### `GET /api/pagos/mis-pagos`
Obtener pagos de la alumna autenticada.

#### `POST /api/pagos/comprobante`
Subir comprobante de pago (requiere autenticación + rol alumna).

**Content-Type:** `multipart/form-data`

**Body (form-data):**
- `comprobante` (file): Imagen (JPEG, JPG, PNG, GIF, WEBP, máx 5MB)
- `monto` (number): Monto del pago
- `fecha_pago` (date): YYYY-MM-DD
- `metodo_pago` (string): efectivo, tarjeta, transferencia, otro
- `tipo_plan` (string): mensual, semanal, sesion, paquete
- `descripcion` (string, opcional)

**Validaciones:**
- `monto` > 0
- `fecha_pago` válida
- `metodo_pago` en valores permitidos
- `tipo_plan` en valores permitidos
- Archivo debe ser imagen válida
- Tamaño máximo 5MB

**Response:**
```json
{
  "success": true,
  "message": "Comprobante subido exitosamente. Esperando validación del administrador.",
  "data": {
    "pago_id": 1,
    "estatus": "pendiente",
    "comprobante_url": "/uploads/comprobantes/comprobante-1234567890.jpg"
  }
}
```

---

## 🔐 SEGURIDAD IMPLEMENTADA

### Autenticación JWT

- **Middleware `authenticate`**: Verifica token JWT en header `Authorization: Bearer <token>`
- **Expiración configurable**: Por defecto 7 días (JWT_EXPIRES_IN)
- **Secret key**: Configurada en `.env` (JWT_SECRET)

### Autorización por Roles

- **Middleware `requireAdmin`**: Solo permite acceso a administradores
- **Middleware `requireAlumna`**: Solo permite acceso a alumnas
- Los endpoints de reservaciones y pagos requieren rol "alumna"

### Validaciones

- **express-validator**: Validación de datos de entrada
- **Multer**: Validación de tipos de archivo (solo imágenes)
- **Límite de tamaño**: 5MB máximo para archivos
- **Validación de fechas**: No permite fechas pasadas en reservaciones

### Protección de Datos

- Contraseñas hasheadas con bcrypt (10 rounds)
- Passwords nunca se retornan en respuestas
- Validación de existencia de recursos antes de operaciones

---

## 💼 LÓGICA DE NEGOCIO

### Gestión de Planes

El sistema maneja 4 tipos de planes:

1. **Mensual**: Plan ilimitado por 30 días (no usa créditos)
2. **Semanal**: Plan ilimitado por 7 días (no usa créditos)
3. **Sesión**: Clase individual (usa 1 crédito, vence en 90 días)
4. **Paquete**: Múltiples clases (usa créditos según cantidad, vence según política)

### Flujo de Reservación

1. **Verificación de acceso:**
   - Tiene créditos disponibles (> 0) O
   - Tiene plan activo (mensual/semanal con fecha_vencimiento >= hoy)

2. **Verificación de disponibilidad:**
   - Calcula lugares disponibles = capacidad_maxima - reservaciones_confirmadas
   - Debe haber al menos 1 lugar disponible

3. **Prevención de duplicados:**
   - Verifica que no exista reservación previa para mismo horario y fecha

4. **Creación de reservación:**
   - Crea registro con estatus 'confirmada'
   - Si NO tiene plan activo: descuenta 1 crédito automáticamente
   - Si tiene plan activo: no descuenta créditos (ilimitado)

### Flujo de Pago

1. **Subida de comprobante:**
   - Alumna sube imagen del comprobante
   - Se guarda en `/uploads/comprobantes/` con nombre único
   - Se crea registro en `pagos` con estatus 'pendiente'

2. **Cálculo automático:**
   - **Fecha de vencimiento:**
     - Mensual: fecha_pago + 30 días
     - Semanal: fecha_pago + 7 días
     - Sesión: fecha_pago + 90 días
     - Paquete: fecha_pago + (cantidad_sesiones / 5) * 30 días

3. **Validación por Admin:**
   - Admin revisa comprobante
   - Si aprueba: estatus → 'completado' + se agregan créditos
   - Si rechaza: estatus → 'cancelado'

4. **Cálculo de créditos (al validar):**
   - Mensual/Semanal: 0 créditos (ilimitado)
   - Sesión: 1 crédito
   - Paquete: monto / precio_por_sesion (ejemplo: $500 / $100 = 5 créditos)

### Regla "No-Show"

- Cuando una reservación cambia a estatus 'no_asistio'
- El trigger SQL descuenta automáticamente 1 crédito
- Solo descuenta si creditos_disponibles > 0
- No hay cancelaciones (solo no_asistio)

### Notificaciones

- El sistema rastrea `fecha_vencimiento_plan` en la tabla `pagos`
- Permite enviar recordatorios de cobro vía WhatsApp usando el campo `telefono` de usuarios
- Se puede consultar pagos próximos a vencer con:
  ```sql
  SELECT * FROM pagos 
  WHERE fecha_vencimiento_plan BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
  AND estatus = 'completado'
  ```

---

## 📝 SERVICIOS (Lógica de Negocio)

### claseService.js

**Funciones:**
- `getClasesDisponibles(filters)`: Obtiene clases con lugares disponibles
- `getClasesDisponiblesPorFecha(fecha, filters)`: Clases disponibles para fecha específica
- `verificarDisponibilidad(horarioId, fecha)`: Verifica lugares disponibles

**Lógica:**
- Calcula lugares disponibles = capacidad_maxima - reservaciones_confirmadas
- Filtra solo horarios/clases activos
- Agrupa por clase y horario

### reservacionService.js

**Funciones:**
- `verificarAccesoReservacion(alumnaId)`: Verifica si puede reservar
- `crearReservacion(alumnaId, horarioId, fechaReserva)`: Crea reservación con validaciones
- `getReservacionesAlumna(alumnaId, filters)`: Obtiene reservaciones de alumna

**Lógica:**
- Usa transacciones SQL para atomicidad
- Verifica acceso (créditos o plan activo)
- Verifica disponibilidad
- Previene duplicados
- Descuenta créditos si no tiene plan activo

### pagoService.js

**Funciones:**
- `calcularFechaVencimiento(fechaPago, tipoPlan, cantidadSesiones)`: Calcula vencimiento
- `calcularCreditos(tipoPlan, monto)`: Calcula créditos según plan
- `crearPago(alumnaId, datosPago, comprobanteUrl)`: Crea registro de pago
- `validarPago(pagoId, aprobar)`: Valida pago (solo admin, no implementado en endpoints aún)
- `getPagosAlumna(alumnaId)`: Obtiene pagos de alumna

**Lógica:**
- Calcula fecha de vencimiento según tipo de plan
- Calcula créditos según tipo de plan y monto
- Guarda comprobante URL
- Estatus inicial: 'pendiente' (requiere validación admin)

---

## 🔧 CONFIGURACIÓN

### Variables de Entorno (.env)

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=academia_pilates
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secret_key_super_segura
JWT_EXPIRES_IN=7d

# Uploads
UPLOAD_DIR=./uploads/comprobantes
MAX_FILE_SIZE=5242880  # 5MB
```

### Dependencias (package.json)

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "dotenv": "^16.3.1",
  "express-validator": "^7.0.1",
  "cors": "^2.8.5"
}
```

---

## 🚀 ESTADO ACTUAL DEL PROYECTO

### ✅ Completado

- [x] Esquema completo de base de datos MySQL
- [x] Triggers SQL para lógica de negocio (no-show)
- [x] Backend REST API con Express
- [x] Autenticación JWT
- [x] Autorización por roles
- [x] Endpoints para alumnas:
  - [x] Ver clases disponibles
  - [x] Crear reservaciones
  - [x] Subir comprobantes de pago
- [x] Validaciones de datos y archivos
- [x] Lógica de negocio completa (créditos, planes, disponibilidad)
- [x] Manejo de errores
- [x] Documentación (README.md)

### ⏳ Pendiente (No implementado aún)

- [ ] Endpoints para administradores:
  - [ ] Validar/rechazar pagos
  - [ ] Gestionar clases y horarios
  - [ ] Gestionar alumnas
  - [ ] Ver todas las reservaciones
  - [ ] Marcar no-show en reservaciones
- [ ] Frontend (no iniciado)
- [ ] Sistema de notificaciones WhatsApp
- [ ] Reportes y estadísticas

---

## 📌 NOTAS IMPORTANTES

1. **Contraseñas**: Deben estar hasheadas con bcrypt antes de insertar en BD. Usar script `scripts/hashPassword.js`

2. **Validación de pagos**: Los pagos quedan en estado "pendiente" hasta que un admin los valide manualmente (endpoint de validación pendiente de implementar)

3. **Créditos**: Se descuentan automáticamente al crear reservación (si no tiene plan activo). Se agregan cuando admin valida un pago.

4. **No-Show**: El trigger SQL descuenta créditos automáticamente cuando una reservación cambia a "no_asistio"

5. **Planes activos**: Los planes mensuales y semanales no usan créditos, permiten reservaciones ilimitadas mientras estén vigentes

6. **Archivos**: Los comprobantes se guardan en `./uploads/comprobantes/` con nombres únicos (timestamp + random)

7. **Transacciones**: Las operaciones críticas (crear reservación, validar pago) usan transacciones SQL para garantizar atomicidad

---

## 🧪 PRUEBAS

Para probar los endpoints, usar herramientas como Postman, Insomnia o curl.

**Ejemplo de flujo completo:**

1. Login: `POST /api/auth/login`
2. Obtener token del response
3. Verificar acceso: `GET /api/reservaciones/verificar-acceso` (con token)
4. Ver clases: `GET /api/clases/disponibles?fecha=2024-01-15` (con token)
5. Crear reservación: `POST /api/reservaciones` (con token)
6. Subir comprobante: `POST /api/pagos/comprobante` (multipart/form-data, con token)

---

## 📚 ARCHIVOS CLAVE

- `schema.sql`: Esquema completo de base de datos
- `server.js`: Punto de entrada del servidor
- `config/database.js`: Configuración de conexión MySQL
- `middleware/auth.js`: Autenticación y autorización
- `services/*.js`: Lógica de negocio
- `controllers/*.js`: Controladores de endpoints
- `routes/*.js`: Definición de rutas

---

**Última actualización:** Proyecto en desarrollo activo. Backend base completo y funcional.









