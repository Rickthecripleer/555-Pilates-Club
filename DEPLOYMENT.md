# 🚀 Guía de Despliegue a la Nube

## 📋 Opciones Recomendadas

### 1. **Render** ⭐ (RECOMENDADO)
**Ventajas:**
- ✅ Plan gratuito disponible
- ✅ Soporta Node.js, React y MySQL
- ✅ Muy fácil de configurar
- ✅ SSL automático (HTTPS)
- ✅ Despliegue automático desde GitHub
- ✅ Todo en un solo lugar

**Precio:** Gratis (con limitaciones) o $7/mes (Starter)

**Link:** https://render.com

---

### 2. **Railway**
**Ventajas:**
- ✅ Muy fácil de usar
- ✅ Plan gratuito con $5 de crédito
- ✅ Soporta Node.js y MySQL
- ✅ Despliegue automático

**Precio:** $5 crédito gratis/mes, luego $0.013/hora (~$9.50/mes)

**Link:** https://railway.app

---

### 3. **Vercel (Frontend) + Railway/Render (Backend) + PlanetScale (DB)**
**Ventajas:**
- ✅ Vercel es excelente para React
- ✅ PlanetScale es MySQL serverless
- ✅ Muy escalable

**Precio:** Vercel (gratis), Railway/Render ($7-10/mes), PlanetScale (gratis con límites)

---

## 🎯 Opción Recomendada: RENDER

### Paso 1: Preparar el Proyecto

1. **Crear cuenta en GitHub** (si no tienes):
   - https://github.com
   - Crear un repositorio nuevo
   - Subir tu código

2. **Crear cuenta en Render**:
   - https://render.com
   - Conectar con GitHub

### Paso 2: Desplegar Base de Datos MySQL

1. En Render, click en **"New +"** → **"PostgreSQL"** (Render no tiene MySQL nativo, pero puedes usar PostgreSQL o MySQL externo)
   
   **O mejor opción: Usar MySQL externo:**
   - **PlanetScale** (gratis): https://planetscale.com
   - **Aiven** (gratis): https://aiven.io
   - **Clever Cloud** (gratis): https://www.clever-cloud.com

### Paso 3: Desplegar Backend

1. En Render, click en **"New +"** → **"Web Service"**
2. Conectar tu repositorio de GitHub
3. Configuración:
   - **Name:** `pilates-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** (dejar vacío, es la raíz)

4. **Variables de Entorno:**
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=tu-host-mysql
   DB_USER=tu-usuario
   DB_PASSWORD=tu-password
   DB_NAME=academia_pilates
   DB_PORT=3306
   JWT_SECRET=tu-secret-super-seguro-aqui
   JWT_EXPIRES_IN=7d
   UPLOAD_DIR=./uploads/comprobantes
   UPLOAD_DIR_CONTENIDO=./uploads/contenido
   MAX_FILE_SIZE=5242880
   ```

### Paso 4: Desplegar Frontend

1. En Render, click en **"New +"** → **"Static Site"**
2. Conectar tu repositorio de GitHub
3. Configuración:
   - **Name:** `pilates-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

4. **Variables de Entorno:**
   ```
   VITE_API_URL=https://pilates-backend.onrender.com/api
   ```

### Paso 5: Configurar CORS en Backend

El backend ya tiene CORS configurado, pero asegúrate de que permita el dominio de Render.

---

## 🔧 Alternativa: Railway (Más Fácil para MySQL)

Railway tiene soporte nativo para MySQL, lo que lo hace más fácil:

### Paso 1: Crear cuenta en Railway
- https://railway.app
- Conectar con GitHub

### Paso 2: Crear Base de Datos MySQL
1. Click en **"New Project"**
2. **"Add Service"** → **"Database"** → **"MySQL"**
3. Railway creará automáticamente las variables de entorno

### Paso 3: Desplegar Backend
1. **"Add Service"** → **"GitHub Repo"**
2. Seleccionar tu repositorio
3. Railway detectará automáticamente Node.js
4. Agregar variables de entorno (Railway ya tiene las de MySQL)

### Paso 4: Desplegar Frontend
1. **"Add Service"** → **"GitHub Repo"** (mismo repo)
2. En configuración:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx vite preview --host 0.0.0.0 --port $PORT`

---

## 📝 Archivos Necesarios

Ya están creados:
- ✅ `render.yaml` (configuración de Render)
- ✅ `.render-build.sh` (script de build)
- ✅ `railway.json` (configuración de Railway)

---

## ⚠️ Consideraciones Importantes

1. **Archivos Uploads**: Los archivos subidos se perderán al reiniciar. Considera usar:
   - **AWS S3** (gratis 5GB)
   - **Cloudinary** (gratis 25GB)
   - **Render Disk** (persistente)

2. **Base de Datos**: 
   - Las bases de datos gratuitas suelen tener límites
   - Considera hacer backups regulares

3. **Variables de Entorno**:
   - NUNCA subas el archivo `.env` a GitHub
   - Configura todas las variables en el panel de Render/Railway

4. **Dominio Personalizado**:
   - Render y Railway permiten agregar tu propio dominio
   - Necesitarás configurar DNS

---

## 🎉 Después del Despliegue

1. Ejecutar migraciones de base de datos
2. Crear usuario admin inicial
3. Configurar contenido de "Sobre Nosotros"
4. Probar todas las funcionalidades

---

## 📞 Soporte

Si tienes problemas, revisa:
- Logs en el panel de Render/Railway
- Variables de entorno configuradas
- Conexión a la base de datos
- CORS configurado correctamente

