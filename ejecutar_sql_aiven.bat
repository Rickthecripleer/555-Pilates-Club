@echo off
echo ========================================
echo Ejecutando script SQL en Aiven
echo ========================================
echo.

cd /d "%~dp0"

echo Conectando a Aiven MySQL...
echo.

C:\xampp\mysql\bin\mysql.exe ^
  -h mysql-27bb5972-pilates-club.c.aivencloud.com ^
  -P 17365 ^
  -u avnadmin ^
  -pAVNS_QVcvyR1a808efNfC5qk ^
  --ssl ^
  --ssl-verify-server-cert=0 ^
  defaultdb ^
  < setup_database_aiven.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Script ejecutado correctamente!
    echo ========================================
    echo.
    echo Ahora ejecutando script para crear usuario admin...
    echo.
    
    C:\xampp\mysql\bin\mysql.exe ^
      -h mysql-27bb5972-pilates-club.c.aivencloud.com ^
      -P 17365 ^
      -u avnadmin ^
      -pAVNS_QVcvyR1a808efNfC5qk ^
      --ssl ^
      --ssl-verify-server-cert=0 ^
      defaultdb ^
      < create_admin_user.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo ✅ Usuario admin creado correctamente!
        echo ========================================
    ) else (
        echo.
        echo ❌ Error al crear usuario admin
    )
) else (
    echo.
    echo ❌ Error al ejecutar el script
    echo.
    echo Posibles causas:
    echo 1. Tu IP no está permitida en Aiven
    echo 2. Problemas de conexión SSL
    echo 3. El servicio MySQL no está activo
    echo.
    echo Solución: Despliega primero en Render y ejecuta desde ahí
)

echo.
pause

