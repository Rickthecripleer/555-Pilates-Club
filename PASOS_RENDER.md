# 🚀 Pasos Detallados para Desplegar en Render

## 📋 PASO 1: Preparar el Código en GitHub

### 1.1 Crear Repositorio en GitHub

1. Ve a https://github.com y crea una cuenta (si no tienes)
2. Click en el botón **"+"** (arriba derecha) → **"New repository"**
3. Nombre: `pilates-club` (o el que prefieras)
4. Marca como **Private** (recomendado) o **Public**
5. **NO** marques "Add a README" (ya tienes archivos)
6. Click **"Create repository"**

### 1.2 Subir tu Código a GitHub

Abre PowerShell o Terminal en la carpeta de tu proyecto y ejecuta:

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit - Pilates Club Platform"

# Conectar con GitHub (reemplaza TU-USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/pilates-club.git

# Subir el código
git branch -M main
git push -u origin main
```

**Nota:** Si te pide usuario y contraseña, usa un **Personal Access Token** de GitHub:
- Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Genera nuevo token con permisos `repo`
- Úsalo como contraseña

---

## 📋 PASO 2: Crear Base de Datos MySQL

### Opción A: PlanetScale (Recomendado - Gratis)

1. Ve a https://planetscale.com
2. Click **"Sign up"** (puedes usar GitHub para registrarte)
3. Click **"Create database"**
4. Nombre: `academia_pilates`
5. Región: Elige la más cercana (ej: `us-east`)
6. Plan: **Free**
7. Click **"Create database"**

8. Una vez creada, ve a **"Connect"** y copia:
   - **Host:** (algo como `xxxxx.us-east-2.psdb.cloud`)
   - **Username:** (algo como `xxxxx`)
   - **Password:** (click en "Show" para verla)
   - **Database name:** `academia_pilates`
   - **Port:** `3306`

**⚠️ IMPORTANTE:** Guarda estas credenciales, las necesitarás después.

### Opción B: Aiven (Alternativa Gratis)

1. Ve a https://aiven.io
2. Crea cuenta gratuita
3. Crea nuevo proyecto
4. Click **"Create service"** → **MySQL**
5. Plan: **Hobbyist** (gratis)
6. Espera a que se cree (5-10 minutos)
7. Ve a **"Overview"** y copia las credenciales

---

## 📋 PASO 3: Crear las Tablas en la Base de Datos

### 3.1 Conectarte a la Base de Datos

**Opción A: Usando MySQL Workbench o phpMyAdmin**
- Conéctate con las credenciales de PlanetScale/Aiven
- Ejecuta los archivos SQL en este orden:

**Opción B: Usando la Terminal (si tienes MySQL instalado)**
```bash
mysql -h TU-HOST -u TU-USUARIO -p TU-DATABASE < schema.sql
```

### 3.2 Ejecutar Scripts SQL

Ejecuta estos archivos en orden:

1. **`schema.sql`** - Crea todas las tablas principales
2. **`migrations/create_contenido_nosotros.sql`** - Crea tabla de contenido
3. **`migrations/create_horarios_fijos.sql`** - Crea tabla de horarios fijos (si existe)
4. **`migrations/create_cambios_horario.sql`** - Crea tabla de cambios (si existe)
5. **`migrations/add_horarios_seleccionados_pagos.sql`** - Agrega campo a pagos
6. **`migrations/add_inscripcion_tipo_plan.sql`** - Agrega tipo inscripción
7. **`migrations/add_password_reset.sql`** - Agrega campos de reset
8. **`migrations/update_clases_horarios.sql`** - Inserta clases y horarios

**O simplemente ejecuta `migrations/reset_database.sql`** que ya tiene todo configurado.

---

## 📋 PASO 4: Desplegar Backend en Render

### 4.1 Crear Cuenta en Render

1. Ve a https://render.com
2. Click **"Get Started for Free"**
3. Elige **"Sign up with GitHub"** (más fácil)
4. Autoriza Render a acceder a tus repositorios

### 4.2 Crear Web Service (Backend)

1. En el dashboard de Render, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio:
   - Si no aparece, click **"Configure account"** y autoriza
   - Selecciona tu repositorio `pilates-club`
3. Configuración:
   - **Name:** `pilates-backend`
   - **Environment:** `Node`
   - **Region:** Elige la más cercana
   - **Branch:** `main`
   - **Root Directory:** (dejar vacío)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free** (o Starter si quieres más recursos)

4. Click **"Advanced"** y agrega estas **Environment Variables**:

```
NODE_ENV=production
PORT=10000
DB_HOST=tu-host-de-planetscale
DB_USER=tu-usuario-de-planetscale
DB_PASSWORD=tu-password-de-planetscale
DB_NAME=academia_pilates
DB_PORT=3306
JWT_SECRET=genera-un-secret-muy-largo-y-seguro-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads/comprobantes
UPLOAD_DIR_CONTENIDO=./uploads/contenido
MAX_FILE_SIZE=5242880
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu-host-de-planetscale` con el HOST que copiaste
- Reemplaza `tu-usuario-de-planetscale` con el USERNAME
- Reemplaza `tu-password-de-planetscale` con el PASSWORD
- Para `JWT_SECRET`, genera uno seguro (puedes usar: https://randomkeygen.com/)

5. Click **"Create Web Service"**
6. Espera a que se despliegue (5-10 minutos)
7. Cuando termine, copia la URL: `https://pilates-backend.onrender.com`

---

## 📋 PASO 5: Desplegar Frontend en Render

### 5.1 Crear Static Site

1. En Render, click **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio: `pilates-club`
3. Configuración:
   - **Name:** `pilates-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://pilates-backend.onrender.com/api
   ```
   (Reemplaza `pilates-backend` con el nombre real de tu backend)

5. Click **"Create Static Site"**
6. Espera a que se despliegue (3-5 minutos)
7. Copia la URL: `https://pilates-frontend.onrender.com`

---

## 📋 PASO 6: Configurar CORS en Backend

1. Ve al dashboard de Render
2. Click en tu servicio `pilates-backend`
3. Ve a **"Environment"**
4. Agrega esta variable:
   ```
   ALLOWED_ORIGINS=https://pilates-frontend.onrender.com
   ```
   (Reemplaza con la URL real de tu frontend)
5. Click **"Save Changes"**
6. Render reiniciará automáticamente el servicio

---

## 📋 PASO 7: Crear Usuario Admin

### 7.1 Generar Hash de Password

En tu máquina local, ejecuta:
```bash
node scripts/hashPassword.js "tu-password-seguro"
```

Copia el hash que te muestre (algo como `$2a$10$...`)

### 7.2 Insertar Usuario en la Base de Datos

Conéctate a tu base de datos MySQL (PlanetScale/Aiven) y ejecuta:

```sql
INSERT INTO usuarios (email, password, rol, nombre, activo) 
VALUES (
  'admin@pilatesclub.com',
  '$2a$10$TU-HASH-AQUI',  -- Pega el hash que generaste
  'admin',
  'Administrador',
  TRUE
);
```

**Reemplaza:**
- `admin@pilatesclub.com` con tu email
- `$2a$10$TU-HASH-AQUI` con el hash que generaste

---

## ✅ ¡Listo! Tu Aplicación Está en la Nube

### URLs de tu Aplicación:
- **Frontend:** `https://pilates-frontend.onrender.com`
- **Backend:** `https://pilates-backend.onrender.com`

### Próximos Pasos:

1. **Probar el Login:**
   - Ve al frontend
   - Intenta iniciar sesión con el usuario admin que creaste

2. **Configurar Contenido:**
   - Inicia sesión como admin
   - Ve a "Sobre Nosotros" y activa "Modo Edición"
   - Sube las imágenes y edita los textos

3. **Probar Funcionalidades:**
   - Crear una alumna de prueba
   - Hacer una reservación
   - Subir un comprobante de pago

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que las variables de entorno `DB_*` estén correctas
- Asegúrate de que la base de datos permita conexiones externas
- En PlanetScale, verifica que el branch esté activo

### Error: "404 Not Found" en el frontend
- Verifica que `VITE_API_URL` apunte al backend correcto
- Revisa los logs en Render (pestaña "Logs")

### Las imágenes no se cargan
- Los uploads en Render son temporales (se pierden al reiniciar)
- Considera usar AWS S3 o Cloudinary para almacenamiento persistente

### El backend no inicia
- Revisa los logs en Render
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que `npm start` funcione localmente

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema en algún paso, avísame y te ayudo a resolverlo.

