# 📝 Variables de Entorno para Railway MySQL en Render

## 🎯 **Variables OBLIGATORIAS (5 variables)**

Estas son las **5 variables mínimas** que necesitas para conectarte a Railway MySQL:

| Variable | Valor para Railway |
|----------|-------------------|
| `DB_HOST` | `switchyard.proxy.rlwy.net` |
| `DB_PORT` | `55856` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `zWWBeaXeMuCmnzaLHaebZluRRnjBccRv` |
| `DB_NAME` | `railway` |

---

## ✅ **Variables RECOMENDADAS (para que todo funcione)**

Además de las 5 anteriores, agrega estas:

| Variable | Valor Recomendado | ¿Para qué? |
|----------|------------------|------------|
| `JWT_SECRET` | `tu_secreto_super_seguro_aqui_123456` | Autenticación de usuarios |
| `NODE_ENV` | `production` | Indica que está en producción |
| `ALLOWED_ORIGINS` | `https://tu-frontend-en-render.onrender.com` | URLs permitidas para CORS |
| `UPLOAD_DIR` | `./uploads/comprobantes` | Carpeta para comprobantes de pago |
| `UPLOAD_DIR_CONTENIDO` | `./uploads/contenido` | Carpeta para imágenes de contenido |
| `MAX_FILE_SIZE` | `5242880` | Tamaño máximo de archivos (5MB) |

---

## 📋 **Resumen: Total de Variables**

### **Mínimo necesario:**
- **5 variables** (solo base de datos)

### **Recomendado completo:**
- **11 variables** (base de datos + funcionalidades)

---

## 🚀 **Cómo Agregarlas en Render:**

1. Ve a Render → Tu servicio → **"Environment"**
2. Haz click en **"Edit"** (arriba a la derecha)
3. Haz click en **"Add Environment Variable"** o **"+"**
4. Agrega cada variable una por una:

### **Paso 1: Agregar las 5 de Base de Datos**

```
Nombre: DB_HOST
Valor: switchyard.proxy.rlwy.net

Nombre: DB_PORT
Valor: 55856

Nombre: DB_USER
Valor: root

Nombre: DB_PASSWORD
Valor: zWWBeaXeMuCmnzaLHaebZluRRnjBccRv

Nombre: DB_NAME
Valor: railway
```

### **Paso 2: Agregar las Recomendadas**

```
Nombre: JWT_SECRET
Valor: (genera uno aleatorio, ejemplo: PilatesClub2024SecretKey!)

Nombre: NODE_ENV
Valor: production

Nombre: ALLOWED_ORIGINS
Valor: https://tu-frontend.onrender.com
(Reemplaza con la URL real de tu frontend en Render)

Nombre: UPLOAD_DIR
Valor: ./uploads/comprobantes

Nombre: UPLOAD_DIR_CONTENIDO
Valor: ./uploads/contenido

Nombre: MAX_FILE_SIZE
Valor: 5242880
```

5. **Guarda** todos los cambios
6. Render se reiniciará automáticamente

---

## ⚠️ **Importante:**

- Si ya tienes variables con los mismos nombres (de Aiven), **reemplázalas** con los valores de Railway
- No necesitas eliminar y crear de nuevo, solo **edita** las existentes
- Después de guardar, espera 1-2 minutos a que Render se reinicie

---

## ✅ **Checklist:**

- [ ] `DB_HOST` = `switchyard.proxy.rlwy.net`
- [ ] `DB_PORT` = `55856`
- [ ] `DB_USER` = `root`
- [ ] `DB_PASSWORD` = `zWWBeaXeMuCmnzaLHaebZluRRnjBccRv`
- [ ] `DB_NAME` = `railway`
- [ ] `JWT_SECRET` = (tu secreto)
- [ ] `NODE_ENV` = `production`
- [ ] `ALLOWED_ORIGINS` = (URL de tu frontend)
- [ ] Guardado y Render reiniciado

---

## 🎯 **Respuesta Directa:**

**Necesitas agregar 5 variables mínimas** para Railway MySQL.

Si quieres que todo funcione completo, agrega **11 variables** en total.

