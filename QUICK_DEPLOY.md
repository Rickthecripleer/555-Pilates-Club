# 🚀 Guía Rápida de Despliegue - RENDER

## ⚡ Pasos Rápidos (15 minutos)

### 1️⃣ Preparar GitHub
```bash
# Si no tienes Git inicializado
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/tu-usuario/pilates-club.git
git push -u origin main
```

### 2️⃣ Crear Base de Datos MySQL

**Opción A: PlanetScale (Recomendado - Gratis)**
1. Ve a https://planetscale.com
2. Crea cuenta gratuita
3. Crea nueva base de datos: `academia_pilates`
4. Copia las credenciales (host, usuario, password)

**Opción B: Aiven (Gratis)**
1. Ve a https://aiven.io
2. Crea cuenta y proyecto
3. Crea servicio MySQL
4. Copia las credenciales

### 3️⃣ Desplegar Backend en Render

1. Ve a https://render.com y crea cuenta
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name:** `pilates-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Variables de Entorno** (en "Environment"):
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=tu-host-de-planetscale
   DB_USER=tu-usuario
   DB_PASSWORD=tu-password
   DB_NAME=academia_pilates
   DB_PORT=3306
   JWT_SECRET=genera-un-secret-seguro-aqui
   JWT_EXPIRES_IN=7d
   UPLOAD_DIR=./uploads/comprobantes
   UPLOAD_DIR_CONTENIDO=./uploads/contenido
   MAX_FILE_SIZE=5242880
   ```

6. Click **"Create Web Service"**
7. Espera a que se despliegue (5-10 minutos)
8. Copia la URL: `https://pilates-backend.onrender.com`

### 4️⃣ Crear Base de Datos en el Servidor

1. Conéctate a tu base de datos MySQL (usando MySQL Workbench, phpMyAdmin, o terminal)
2. Ejecuta el archivo `schema.sql` para crear las tablas
3. Ejecuta `migrations/create_contenido_nosotros.sql` para el contenido

### 5️⃣ Desplegar Frontend en Render

1. En Render, click **"New +"** → **"Static Site"**
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name:** `pilates-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

4. **Variables de Entorno**:
   ```
   VITE_API_URL=https://pilates-backend.onrender.com/api
   ```
   (Reemplaza con la URL real de tu backend)

5. Click **"Create Static Site"**
6. Espera a que se despliegue

### 6️⃣ Configurar CORS

En el backend de Render, agrega esta variable de entorno:
```
ALLOWED_ORIGINS=https://pilates-frontend.onrender.com
```

### 7️⃣ Crear Usuario Admin

1. Conéctate a tu base de datos
2. Ejecuta este SQL (reemplaza con tu email y password hasheado):
```sql
INSERT INTO usuarios (email, password, rol, nombre, activo) 
VALUES (
  'admin@pilatesclub.com',
  '$2a$10$TuHashDePasswordAqui', -- Usa: node scripts/hashPassword.js "tu-password"
  'admin',
  'Administrador',
  TRUE
);
```

Para generar el hash de password:
```bash
node scripts/hashPassword.js "tu-password-seguro"
```

## ✅ Listo!

Tu aplicación estará disponible en:
- **Frontend:** `https://pilates-frontend.onrender.com`
- **Backend:** `https://pilates-backend.onrender.com`

## 🔧 Troubleshooting

**Error de conexión a BD:**
- Verifica que las variables de entorno estén correctas
- Asegúrate de que la BD permita conexiones externas

**Error 404 en frontend:**
- Verifica que `VITE_API_URL` apunte al backend correcto
- Revisa los logs en Render

**Imágenes no se muestran:**
- Los uploads en Render son temporales
- Considera usar S3 o Cloudinary para almacenamiento persistente

## 📝 Próximos Pasos

1. Configurar dominio personalizado (opcional)
2. Configurar almacenamiento persistente para imágenes
3. Configurar backups de base de datos
4. Configurar monitoreo y alertas

