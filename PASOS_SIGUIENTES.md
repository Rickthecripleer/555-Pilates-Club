# 🚀 Pasos Siguientes - Qué Hacer Ahora

## ✅ **Lo que Ya Está Hecho:**

1. ✅ Variables de entorno configuradas en Render
2. ✅ Base de datos Railway MySQL conectada
3. ✅ Tablas creadas (3 clases, 25 horarios, 45 contenido)
4. ✅ Código subido a GitHub

---

## ⏳ **Lo que Falta Hacer:**

### **PASO 1: Crear Usuario Administrador**

1. En Render, ve a tu servicio "555-Pilates-Club"
2. Haz **"Manual Deploy"** → **"Deploy latest commit"** (para tener el script actualizado)
3. Espera 2-3 minutos
4. Ve a **"Shell"** en Render
5. Ejecuta:
   ```bash
   npm run create:admin
   ```
6. Deberías ver: ✅ Usuario administrador creado correctamente

**Credenciales del admin:**
- Email: `Moralesterron1995@outlook.es`
- Contraseña: `Keepitjuicy1505*`

---

### **PASO 2: Desplegar Frontend en Render**

1. En Render, click **"+ New"** → **"Static Site"**
2. Conecta el repositorio: **`555-Pilates-Club`**
3. Configuración:
   - **Name:** `pilates-frontend` (o el nombre que prefieras)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. **Variables de Entorno:**
   - Click en **"Add Environment Variable"**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://five55-pilates-club.onrender.com/api`
     (Reemplaza con la URL real de tu backend en Render)
5. Click **"Create Static Site"**
6. Espera 3-5 minutos
7. Copia la URL del frontend (ejemplo: `https://pilates-frontend.onrender.com`)

---

### **PASO 3: Actualizar CORS en Backend**

1. En Render, ve a tu servicio backend "555-Pilates-Club"
2. Ve a **"Environment"**
3. Busca la variable `ALLOWED_ORIGINS`
4. Actualiza el valor con la URL real de tu frontend:
   ```
   https://pilates-frontend.onrender.com,http://localhost:5173
   ```
   (Reemplaza `pilates-frontend.onrender.com` con la URL real que te dio Render)
5. Guarda los cambios
6. Render se reiniciará automáticamente

---

### **PASO 4: Probar que Todo Funciona**

1. Ve a la URL de tu frontend (ejemplo: `https://pilates-frontend.onrender.com`)
2. Intenta hacer login con:
   - Email: `Moralesterron1995@outlook.es`
   - Contraseña: `Keepitjuicy1505*`
3. Si funciona, ¡está todo listo! 🎉

---

## 📋 **Checklist Final:**

- [ ] Usuario admin creado (`npm run create:admin`)
- [ ] Frontend desplegado en Render
- [ ] Variable `VITE_API_URL` configurada en frontend
- [ ] Variable `ALLOWED_ORIGINS` actualizada en backend
- [ ] Login probado y funcionando

---

## 🎯 **¿Qué Hacer Ahora?**

**Empieza con el PASO 1:** Crear el usuario administrador.

¿Puedes hacer el deploy manual en Render y luego ejecutar `npm run create:admin` en el Shell?

