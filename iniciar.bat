@echo off
echo Iniciando Consola de Equipo...

start "Backend" cmd /k "cd /d C:\Users\Francisco\Documents\team-console\backend && node server.js"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d C:\Users\Francisco\Documents\team-console\frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "ngrok" cmd /k "ngrok http 5173"

echo.
echo Todo iniciado. Puedes minimizar estas ventanas.
echo Consola admin: http://localhost:5173
echo.
pause
