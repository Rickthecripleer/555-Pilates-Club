@echo off
echo ========================================
echo   INICIANDO SISTEMA PILATES
echo ========================================
echo.

REM Cerrar procesos anteriores
taskkill /F /IM node.exe >nul 2>&1

echo [1/2] Iniciando Backend...
start "Backend - Pilates" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend...
start "Frontend - Pilates" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo ========================================
echo   LISTO!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Abre tu navegador en: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul









