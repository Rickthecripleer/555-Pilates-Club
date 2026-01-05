# 🚀 Configurar Aiven MySQL desde Cero

## 📋 **Paso a Paso Completo**

---

## **PASO 1: Crear Nuevo Servicio MySQL en Aiven**

### 1.1 Ir a Aiven Dashboard
1. Ve a: **https://console.aiven.io/**
2. Inicia sesión con tu cuenta

### 1.2 Crear Nuevo Servicio
1. Click en **"Create service"** o **"New service"**
2. Selecciona:
   - **Service type:** `MySQL`
   - **Cloud provider:** Elige el más cercano (AWS, Google Cloud, Azure)
   - **Region:** Elige la más cercana a ti
   - **Plan:** 
     - **Free tier** (si está disponible) - 3 meses gratis
     - O **Startup** (~$7/mes) si no hay free tier

### 1.3 Configuración del Servicio
- **Service name:** `pilates-mysql` (o el nombre que prefieras)
- **MySQL version:** La más reciente (8.0 o superior)
- Click **"Create service"**

**⏱️ Espera 2-5 minutos** mientras se crea el servicio.

---

## **PASO 2: Configurar Network Access (MUY IMPORTANTE)**

### 2.1 Ir a Network Access
1. Una vez creado el servicio, click en él
2. En el menú lateral, busca **"Network access"** o **"Network"**
3. Click en **"Add network"** o **"Add IP"**

### 2.2 Agregar Red Pública
1. En el campo, escribe: **`0.0.0.0/0`**
   - Esto permite conexiones desde cualquier IP (incluyendo Render)
2. **Descripción:** `Render Backend - All IPs`
3. Click **"Add"** o **"Save"**

**✅ Esto es CRÍTICO - sin esto, Render no podrá conectarse**

---

## **PASO 3: Obtener Credenciales de Conexión**

### 3.1 Ir a Connection Information
1. En el menú lateral del servicio, click **"Connection information"** o **"Overview"**
2. Ahí verás:
   - **Host:** Algo como `mysql-xxxxx-xxxxx.c.aivencloud.com`
   - **Port:** Un número (ej: 17365)
   - **Database:** `defaultdb` (por defecto)
   - **User:** `avnadmin` (por defecto)
   - **Password:** (click en el ojo para verla)

### 3.2 Copiar Credenciales
Copia todas estas credenciales, las necesitarás para Render:
- ✅ Host
- ✅ Port
- ✅ Database
- ✅ User
- ✅ Password

---

## **PASO 4: Configurar Variables de Entorno en Render**

### 4.1 Ir a tu Backend en Render
1. Ve a tu dashboard de Render
2. Click en tu servicio backend (ej: `pilates-backend`)

### 4.2 Agregar Variables de Entorno
1. Ve a la pestaña **"Environment"**
2. Agrega o actualiza estas variables:

| Key | Value (usa las de tu nuevo servicio Aiven) |
|-----|-------------------------------------------|
| `DB_HOST` | El host que copiaste (ej: `mysql-xxxxx.c.aivencloud.com`) |
| `DB_PORT` | El puerto que copiaste (ej: `17365`) |
| `DB_NAME` | `defaultdb` (o el nombre que hayas puesto) |
| `DB_USER` | `avnadmin` (o el usuario que hayas creado) |
| `DB_PASSWORD` | La contraseña que copiaste |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | `pilates-club-2026-secret-key-super-seguro` |
| `JWT_EXPIRES_IN` | `7d` |
| `UPLOAD_DIR` | `./uploads/comprobantes` |
| `ALLOWED_ORIGINS` | URL de tu frontend en Render |

3. Click **"Save Changes"**
4. Render reiniciará automáticamente

---

## **PASO 5: Crear las Tablas en la Base de Datos**

### 5.1 Opción A: Desde Render Shell (Recomendado)
1. Ve a tu servicio backend en Render
2. Click en **"Shell"** (arriba a la derecha)
3. Ejecuta:
```bash
npm run setup:aiven
```

### 5.2 Opción B: Desde tu Computadora Local
1. Crea un archivo `.env` con las credenciales de Aiven
2. Ejecuta:
```bash
npm run setup:aiven
```

### 5.3 Verificar
Deberías ver mensajes como:
- ✅ "Conectado exitosamente!"
- ✅ "Base de datos configurada correctamente"

---

## **PASO 6: Crear Usuario Administrador**

### 6.1 Desde Render Shell
```bash
npm run create:admin
```

O desde tu computadora local (con `.env` configurado):
```bash
npm run create:admin
```

Esto creará el usuario admin:
- **Email:** `Moralesterron1995@outlook.es`
- **Contraseña:** `Keepitjuicy1505*`

---

## **PASO 7: Verificar que Todo Funciona**

### 7.1 Revisar Logs en Render
1. Ve a tu backend en Render
2. Click en **"Logs"**
3. Deberías ver:
   - ✅ "Conexión a la base de datos establecida"
   - ✅ Sin errores de conexión

### 7.2 Probar la API
1. Ve a la URL de tu backend (ej: `https://pilates-backend.onrender.com`)
2. Prueba un endpoint simple como: `/api/health` o `/api/clases`

---

## ✅ **Checklist Final:**

- [ ] Servicio MySQL creado en Aiven
- [ ] Network Access configurado (`0.0.0.0/0`)
- [ ] Credenciales copiadas
- [ ] Variables de entorno configuradas en Render
- [ ] Tablas creadas (`npm run setup:aiven`)
- [ ] Usuario admin creado (`npm run create:admin`)
- [ ] Backend funcionando sin errores

---

## 🆘 **Si Algo Sale Mal:**

### Error: "Access denied"
- ✅ Verifica que Network Access tenga `0.0.0.0/0`
- ✅ Verifica que las credenciales sean correctas

### Error: "Connection timeout"
- ✅ Verifica que el servicio MySQL esté "Running" en Aiven
- ✅ Espera 2-3 minutos después de agregar Network Access

### Error: "Table doesn't exist"
- ✅ Ejecuta `npm run setup:aiven` de nuevo

---

## 🎯 **¿Listo para Empezar?**

¿Quieres que te guíe paso a paso mientras lo haces? O si prefieres, puedo ayudarte a verificar cada paso.

