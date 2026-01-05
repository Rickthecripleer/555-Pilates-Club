# 🚀 Desplegar Frontend en Render

## 📋 **Paso a Paso:**

### **Paso 1: Crear Static Site en Render**

1. En Render, haz click en **"+ New"** (arriba a la derecha)
2. Selecciona **"Static Site"**

---

### **Paso 2: Conectar Repositorio**

1. Si no aparece tu repositorio, haz click en **"Configure account"** y autoriza
2. Selecciona: **`555-Pilates-Club`**
3. Click **"Continue"**

---

### **Paso 3: Configuración del Frontend**

Completa estos campos:

- **Name:** `pilates-frontend` (o el nombre que prefieras)
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `frontend/dist`

---

### **Paso 4: Variables de Entorno**

**ANTES de crear**, haz click en **"Add Environment Variable"**:

- **Key:** `VITE_API_URL`
- **Value:** `https://five55-pilates-club.onrender.com/api`
  (⚠️ **IMPORTANTE:** Reemplaza `five55-pilates-club` con el nombre real de tu backend en Render)

**Cómo saber la URL de tu backend:**
- Ve a tu servicio backend "555-Pilates-Club" en Render
- La URL aparece arriba, algo como: `https://five55-pilates-club.onrender.com`
- Agrega `/api` al final: `https://five55-pilates-club.onrender.com/api`

---

### **Paso 5: Crear el Sitio**

1. Click en **"Create Static Site"**
2. Espera 3-5 minutos mientras se construye
3. Cuando termine, verás la URL de tu frontend (ejemplo: `https://pilates-frontend.onrender.com`)

---

### **Paso 6: Actualizar CORS en Backend**

Una vez que tengas la URL del frontend:

1. Ve a tu servicio backend "555-Pilates-Club" en Render
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

## ✅ **Checklist:**

- [ ] Static Site creado en Render
- [ ] Repositorio conectado
- [ ] Configuración correcta (Root Directory: `frontend`)
- [ ] Variable `VITE_API_URL` configurada con la URL del backend
- [ ] Frontend desplegado (URL disponible)
- [ ] Variable `ALLOWED_ORIGINS` actualizada en backend con la URL del frontend

---

## 🎯 **Después de Desplegar:**

1. Ve a la URL de tu frontend
2. Intenta hacer login con:
   - Email: `Moralesterron1995@outlook.es`
   - Contraseña: `Keepitjuicy1505*`
3. Si funciona, ¡está todo listo! 🎉

---

## ❓ **¿Problemas?**

Si el frontend no carga o hay errores:
- Verifica que `VITE_API_URL` apunte al backend correcto
- Verifica que `ALLOWED_ORIGINS` en el backend incluya la URL del frontend
- Revisa los logs del frontend en Render

