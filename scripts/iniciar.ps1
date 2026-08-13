# Arranca el panel en esta PC (Windows PowerShell).
# Uso: clic derecho > Ejecutar con PowerShell, o:
#   powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "No está Node.js. Instalá la versión LTS en https://nodejs.org"
  Write-Host "Cerrá y volvé a abrir PowerShell después de instalarlo."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm no está en el PATH. Cerrá PowerShell y abrilo de nuevo después de instalar Node."
  exit 1
}

if (-not (Test-Path ".env")) {
  Copy-Item "env.example" ".env"
  Write-Host "Creé el archivo .env. Abrilo con el Bloc de notas, pegá GYG_GITHUB_TOKEN y GYG_IMGUR_CLIENT_ID, guardá y volvé a correr este script."
  notepad ".env"
  exit 0
}

Write-Host "Instalando dependencias..."
npm install
Write-Host "Iniciando el panel en http://localhost:3000"
npm start
