@echo off
title G&G Automotores
cd /d "%~dp0"
echo.
echo  G&G Automotores — panel de stock
echo  =================================
echo  Deja esta ventana abierta mientras uses el sistema.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo arrancar. Revisa el mensaje de arriba.
  pause
)
