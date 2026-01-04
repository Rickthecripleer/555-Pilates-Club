# Backend API - Plataforma Academia de Pilates

Backend REST API para la gestión de una academia de pilates con sistema de reservaciones, pagos y gestión de planes.

## 🚀 Características

- **Autenticación JWT** con roles (admin/alumna)
- **Gestión de clases y horarios** disponibles
- **Sistema de reservaciones** con validación de créditos y planes activos
- **Subida de comprobantes de pago** con validación de archivos
- **Control de créditos** y planes (mensual, semanal, sesión, paquete)
- **Validación de "No-Show"** con descuento automático de créditos
- **Código modular y escalable**

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar o navegar al proyecto:**
```bash
cd PILATES
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales de base de datos:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=academia_pilates
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=tu_secret_key_super_segura_aqui
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads/comprobantes
MAX_FILE_SIZE=5242880
```

4. **Crear la base de datos:**
```bash
# Ejecutar el script SQL
mysql -u root -p < schema.sql
```

5. **Crear directorio de uploads:**
```bash
mkdir -p uploads/comprobantes
```

## 🏃 Ejecutar el Servidor

### Opción 1: Script Automático (Windows)
**Doble clic en:** `INICIAR_SIMPLE.bat`

Esto iniciará automáticamente:
- Backend en una ventana (http://localhost:3000)
- Frontend en otra ventana (http://localhost:5173)

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El backend estará disponible en `http://localhost:3000`  
El frontend estará disponible en `http://localhost:5173`

## 📚 Endpoints de la API

### Autenticación

#### `POST /api/auth/login`
Iniciar sesión (alumnas y admins)

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
Obtener información del usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
```

---

### Clases

#### `GET /api/clases/disponibles`
Obtener clases disponibles filtradas por horario

**Query Parameters:**
- `dia_semana` (opcional): lunes, martes, miercoles, etc.
- `hora_inicio` (opcional): HH:MM:SS
- `hora_fin` (opcional): HH:MM:SS
- `fecha` (opcional): YYYY-MM-DD

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:**
```
GET /api/clases/disponibles?dia_semana=lunes&fecha=2024-01-15
```

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
Verificar si la alumna tiene acceso para reservar

**Headers:**
```
Authorization: Bearer <token>
```

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
Obtener reservaciones de la alumna autenticada

**Query Parameters:**
- `estatus` (opcional): confirmada, cancelada, completada, no_asistio
- `fecha_desde` (opcional): YYYY-MM-DD
- `fecha_hasta` (opcional): YYYY-MM-DD

**Headers:**
```
Authorization: Bearer <token>
```

#### `POST /api/reservaciones`
Crear una nueva reservación

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "horario_id": 1,
  "fecha_reserva": "2024-01-15"
}
```

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
Obtener pagos de la alumna autenticada

**Headers:**
```
Authorization: Bearer <token>
```

#### `POST /api/pagos/comprobante`
Subir comprobante de pago

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- `comprobante` (file): Imagen del comprobante (JPEG, JPG, PNG, GIF, WEBP, máx 5MB)
- `monto` (number): Monto del pago
- `fecha_pago` (date): Fecha del pago (YYYY-MM-DD)
- `metodo_pago` (string): efectivo, tarjeta, transferencia, otro
- `tipo_plan` (string): mensual, semanal, sesion, paquete
- `descripcion` (string, opcional): Descripción adicional

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

## 🔐 Seguridad

- **Autenticación JWT**: Todos los endpoints (excepto login) requieren token
- **Autorización por roles**: Endpoints de alumnas solo accesibles para rol "alumna"
- **Validación de datos**: Express-validator para validar inputs
- **Validación de archivos**: Solo imágenes permitidas, tamaño máximo 5MB
- **Protección de rutas**: Middleware de autenticación y autorización

## 📁 Estructura del Proyecto

```
PILATES/
├── config/
│   ├── database.js          # Configuración de MySQL
│   └── upload.js            # Configuración de Multer
├── controllers/
│   ├── authController.js    # Autenticación
│   ├── claseController.js   # Clases
│   ├── reservacionController.js  # Reservaciones
│   └── pagoController.js    # Pagos
├── middleware/
│   ├── auth.js              # JWT y autorización
│   └── validation.js        # Validaciones
├── routes/
│   ├── authRoutes.js
│   ├── claseRoutes.js
│   ├── reservacionRoutes.js
│   └── pagoRoutes.js
├── services/
│   ├── claseService.js      # Lógica de negocio - Clases
│   ├── reservacionService.js # Lógica de negocio - Reservaciones
│   └── pagoService.js        # Lógica de negocio - Pagos
├── uploads/
│   └── comprobantes/        # Archivos subidos
├── .env                     # Variables de entorno (no commitear)
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── README.md
├── schema.sql               # Esquema de base de datos
└── server.js                # Servidor principal
```

## 🧪 Pruebas

Para probar los endpoints, puedes usar herramientas como:
- **Postman**
- **Insomnia**
- **Thunder Client** (VS Code)
- **curl**

### Ejemplo con curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alumna@example.com","password":"password123"}'

# Obtener clases disponibles (usar token del login)
curl -X GET http://localhost:3000/api/clases/disponibles \
  -H "Authorization: Bearer <tu_token>"
```

## 📝 Notas Importantes

1. **Credenciales de usuarios**: Las contraseñas deben estar hasheadas con bcrypt antes de insertarlas en la BD. Puedes usar `node scripts/hashPassword.js "tu_password"` para generar hashes.
2. **Datos de prueba**: Usa `seed.sql` para insertar usuarios y datos de prueba (recuerda generar los hashes de contraseña primero).
3. **Validación de pagos**: Los pagos quedan en estado "pendiente" hasta que un admin los valide desde `/admin/pagos`.
4. **Créditos**: Se descuentan automáticamente al crear una reservación (si no tiene plan activo).
5. **No-Show**: El trigger SQL descuenta créditos automáticamente cuando una reservación cambia a "no_asistio".
6. **Planes activos**: Los planes mensuales y semanales no usan créditos, permiten reservaciones ilimitadas.

## 📚 Documentación Adicional

- **`CONTEXTO_PROYECTO.md`**: Documentación completa del proyecto, esquema de BD y arquitectura
- **`GUIA_IMPLEMENTACION_DETALLADA.md`**: Guía detallada de implementación y extensión del sistema
- **`FLUJOS_SISTEMA.md`**: Diagramas de flujo del sistema
- **`EXPLICACION_SIMPLE_CLIENTE.md`**: Explicación simple para el cliente final
- **`CONFIGURACION_WHATSAPP_FRONTEND.md`**: Configuración de WhatsApp en el frontend

## 🐛 Solución de Problemas

**Error de conexión a la base de datos:**
- Verificar que MySQL esté corriendo
- Revisar credenciales en `.env`
- Verificar que la base de datos exista

**Error al subir archivos:**
- Verificar que el directorio `uploads/comprobantes` exista
- Verificar permisos de escritura
- Verificar tamaño del archivo (máx 5MB)

## 📄 Licencia

ISC





