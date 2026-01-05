# 🔧 Solucionar Errores

## ❌ **Error 1: "Unknown column 'r.es_automatica'"**

### **Problema:**
La tabla `reservaciones` no tiene las columnas `es_automatica` y `horario_fijo_id`.

### **Solución:**

1. **Hacer deploy manual en Render:**
   - Ve a tu backend "555-Pilates-Club" en Render
   - Haz click en **"Manual Deploy"** → **"Deploy latest commit"**
   - Espera 2-3 minutos

2. **Ejecutar el script de corrección:**
   - Ve a **"Shell"** en Render
   - Ejecuta:
     ```bash
     npm run fix:columns
     ```
   - Deberías ver: ✅ Columnas agregadas correctamente

3. **Recargar la página:**
   - Ve a tu frontend y recarga la página de "Asistencia"
   - El error debería desaparecer

---

## 📱 **Error 2: El link no se abre en el celular**

### **Posibles Causas:**

#### **1. Problema de CORS (Más Probable)**

**Solución:**
1. En Render, ve a tu backend "555-Pilates-Club" → **"Environment"**
2. Verifica que `ALLOWED_ORIGINS` incluya la URL del frontend:
   ```
   https://pilates-frontend-n1dc.onrender.com,http://localhost:5173
   ```
3. Si falta, agrégalo y guarda
4. Render se reiniciará automáticamente

#### **2. El Frontend no es Accesible desde Móviles**

**Verificar:**
1. Abre el link en el celular: `https://pilates-frontend-n1dc.onrender.com`
2. Si no carga, puede ser un problema de red o DNS

**Solución:**
- Espera unos minutos (a veces Render tarda en propagar DNS)
- Intenta desde otra red (WiFi vs datos móviles)
- Limpia la caché del navegador en el celular

#### **3. Problema de HTTPS/SSL**

**Verificar:**
- El link debe empezar con `https://` (no `http://`)
- Render usa HTTPS automáticamente

#### **4. Problema de Autenticación en Móvil**

Si el login no funciona en el celular:
- Verifica que el token JWT se esté guardando correctamente
- Limpia la caché del navegador
- Intenta en modo incógnito

---

## ✅ **Checklist de Verificación:**

### **Para el Error de Columnas:**
- [ ] Deploy manual hecho en Render
- [ ] Script `npm run fix:columns` ejecutado
- [ ] Página de Asistencia recargada
- [ ] Error desapareció

### **Para el Problema del Celular:**
- [ ] `ALLOWED_ORIGINS` incluye la URL del frontend
- [ ] El link funciona en PC
- [ ] El link funciona en celular (probado)
- [ ] HTTPS está habilitado
- [ ] Caché del navegador limpiada

---

## 🎯 **Pasos Inmediatos:**

1. **Ejecuta el script de corrección:**
   ```bash
   npm run fix:columns
   ```

2. **Verifica CORS:**
   - Backend → Environment → `ALLOWED_ORIGINS`

3. **Prueba en el celular:**
   - Abre: `https://pilates-frontend-n1dc.onrender.com`
   - Intenta hacer login

---

## ❓ **Si Aún No Funciona:**

**Para el error de columnas:**
- Revisa los logs del backend en Render
- Verifica que el script se ejecutó correctamente

**Para el problema del celular:**
- Abre la consola del navegador en el celular (si es posible)
- O prueba desde otro dispositivo
- Verifica que la URL sea exactamente: `https://pilates-frontend-n1dc.onrender.com`

