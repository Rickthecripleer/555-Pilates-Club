# 🚀 Migrar a Render PostgreSQL - Guía Completa

## ✅ Plan: Usar Render para Todo

1. ✅ Backend en Render (ya lo tienes)
2. ✅ PostgreSQL en Render (gratis por 30 días)
3. ✅ Frontend en Render (gratis)

---

## 📋 PASO 1: Crear PostgreSQL en Render

### 1.1 Crear Base de Datos
1. Ve a Render: https://dashboard.render.com
2. Click **"+ New"** → **"PostgreSQL"**
3. Configuración:
   - **Name:** `pilates-database`
   - **Database:** `pilates_db` (o déjalo por defecto)
   - **User:** Se crea automáticamente
   - **Region:** Misma región que tu backend
   - **PostgreSQL Version:** 15 (o la más reciente)
   - **Plan:** **Free** (gratis por 30 días)
4. Click **"Create Database"**
5. Espera 2-3 minutos

### 1.2 Copiar Credenciales
Una vez creado, Render te mostrará:
- **Internal Database URL** (para usar dentro de Render)
- **External Database URL** (para usar desde fuera)
- **Host**
- **Port**
- **Database**
- **User**
- **Password**

**¡Copia estas credenciales!** Las necesitarás en el siguiente paso.

---

## 📋 PASO 2: Actualizar Variables de Entorno del Backend

1. Ve a tu servicio backend "555-Pilates-Club" en Render
2. Pestaña **"Environment"**
3. **Actualiza estas variables:**

| Variable | Valor (ejemplo) |
|----------|----------------|
| `DB_HOST` | `dpg-xxxxx-a.oregon-postgres.render.com` |
| `DB_USER` | `pilates_db_user` |
| `DB_PASSWORD` | `[tu_password_de_render]` |
| `DB_NAME` | `pilates_db` |
| `DB_PORT` | `5432` |

**O mejor aún**, usa la **Internal Database URL** completa:
- Agrega variable: `DATABASE_URL` = `postgresql://user:password@host:port/database`

4. Click **"Save Changes"**
5. Render reiniciará automáticamente

---

## 📋 PASO 3: Adaptar el Código para PostgreSQL

### 3.1 Actualizar package.json
Necesitamos cambiar de `mysql2` a `pg` (PostgreSQL).

**En tu computadora local**, actualiza `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "pg-pool": "^3.6.1"
  }
}
```

Y elimina `mysql2`.

### 3.2 Actualizar config/database.js
Cambiar de MySQL a PostgreSQL:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para ejecutar consultas
const query = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error);
        throw error;
    }
};

// Función para obtener una conexión del pool (para transacciones)
const getConnection = async () => {
    return await pool.connect();
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión a la base de datos establecida');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    getConnection,
    testConnection
};
```

### 3.3 Convertir SQL de MySQL a PostgreSQL
El SQL necesita cambios:
- `AUTO_INCREMENT` → `SERIAL` o `GENERATED ALWAYS AS IDENTITY`
- `DATETIME` → `TIMESTAMP`
- `BOOLEAN` → `BOOLEAN` (igual)
- `ENGINE=InnoDB` → Eliminar (PostgreSQL no usa engines)
- `DEFAULT CHARSET` → Eliminar

---

## 📋 PASO 4: Crear Script SQL para PostgreSQL

Necesitamos convertir `setup_database_aiven.sql` a PostgreSQL.

**Te crearé un archivo nuevo:** `setup_database_postgresql.sql`

---

## 📋 PASO 5: Subir Cambios a GitHub

1. Haz commit de los cambios:
```bash
git add .
git commit -m "Migrar a PostgreSQL"
git push origin main
```

2. Render se actualizará automáticamente

---

## 📋 PASO 6: Crear las Tablas

1. Ve al Shell de Render
2. Ejecuta:
```bash
node scripts/setup_postgresql_database.js
```

---

## ⚠️ IMPORTANTE: Esto Requiere Cambios de Código

**Necesitamos:**
1. ✅ Cambiar `mysql2` por `pg` en package.json
2. ✅ Actualizar `config/database.js` para PostgreSQL
3. ✅ Convertir el SQL de MySQL a PostgreSQL
4. ✅ Actualizar todas las consultas SQL (algunas pueden necesitar cambios)

**¿Quieres que haga estos cambios ahora?**

---

## 🎯 Alternativa Rápida (Recomendada)

**Si quieres avanzar rápido**, podemos:
1. Crear PostgreSQL en Render
2. Yo adapto todo el código
3. Subes los cambios
4. Listo

**¿Quieres que adapte el código ahora?**

