# 🚀 SOLUCIÓN COMPLETA - Sistema Funcional

## ✅ Lo que necesitamos hacer:

1. ✅ Actualizar Render a Starter ($7/mes) - Para Shell y almacenamiento
2. ✅ Crear las tablas en la base de datos
3. ✅ Crear usuario admin
4. ✅ Configurar almacenamiento para imágenes
5. ✅ Desplegar frontend
6. ✅ Configurar CORS

---

## 📋 PASO 1: Actualizar Render a Starter

### ¿Por qué Starter?
- ✅ **Shell disponible** - Para ejecutar scripts
- ✅ **Discos persistentes** - Para almacenar imágenes de comprobantes
- ✅ **Cero downtime** - El servicio no se apaga
- ✅ **Solo $7/mes** - Muy económico

### Cómo actualizar:
1. En Render, ve a tu servicio "555-Club de Pilates"
2. Click en el botón **"Actualice su instancia →"** (arriba, junto al nombre)
3. O ve a **"Escalada"** (Scaling) en el menú lateral
4. Selecciona **"Starter"** ($7/mes)
5. Click **"Actualizar"**
6. Espera 2-3 minutos a que se actualice

---

## 📋 PASO 2: Crear las Tablas (Después de actualizar)

Una vez que tengas Starter y el Shell disponible:

1. Ve a **"Caparazón"** (Shell) en Render
2. Ejecuta:
```bash
npm run setup:aiven
```
3. Espera a que termine (verás progreso)
4. Luego ejecuta:
```bash
npm run create:admin
```

---

## 📋 PASO 3: Verificar Almacenamiento

Los archivos se guardarán en:
- **Comprobantes:** `./uploads/comprobantes/`
- **Contenido:** `./uploads/contenido/`

Con Starter, estos directorios son **persistentes** (no se borran al reiniciar).

---

## 📋 PASO 4: Desplegar Frontend

1. En Render, click **"+ Nuevo"** → **"Static Site"**
2. Conecta el repositorio: `555-Pilates-Club`
3. Configuración:
   - **Name:** `pilates-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. **Variables de Entorno:**
   - `VITE_API_URL` = `https://five55-pilates-club.onrender.com/api`
   (Reemplaza con la URL real de tu backend)
5. Click **"Create Static Site"**

---

## 📋 PASO 5: Configurar CORS

1. Ve a tu servicio backend en Render
2. Pestaña **"Ambiente"** (Environment)
3. Agrega variable:
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** `https://pilates-frontend.onrender.com`
   (Reemplaza con la URL real de tu frontend)
4. Click **"Save Changes"**

---

## ✅ RESULTADO FINAL

Tu sistema estará completamente funcional con:
- ✅ Backend funcionando
- ✅ Base de datos con todas las tablas
- ✅ Usuario admin creado
- ✅ Almacenamiento para imágenes
- ✅ Frontend desplegado
- ✅ Todo conectado y funcionando

### Credenciales Admin:
- **Email:** `Moralesterron1995@outlook.es`
- **Contraseña:** `Keepitjuicy1505*`

### URLs:
- **Backend:** `https://five55-pilates-club.onrender.com`
- **Frontend:** `https://pilates-frontend.onrender.com`

---

## 💰 Costo Total

- **Render Starter:** $7/mes (backend)
- **Render Static Site:** Gratis (frontend)
- **Aiven MySQL:** Gratis (plan básico)
- **Total:** ~$7/mes

---

## 🎯 ¿Listo para empezar?

1. Actualiza a Starter en Render
2. Avísame cuando esté listo
3. Te guío para ejecutar los scripts

