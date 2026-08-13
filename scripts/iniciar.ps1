# Arranca el panel en esta PC (Windows PowerShell).
# Uso: clic derecho > Ejecutar con PowerShell, o:
#   powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "No está Node.js. Instalá la versión LTS (22) en https://nodejs.org"
  Write-Host "Elegí el botón verde LTS, no Current. Cerrá y volvé a abrir PowerShell después."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm no está en el PATH. Cerrá PowerShell y abrilo de nuevo después de instalar Node."
  exit 1
}

$nodeVersion = node -v
$nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
if ($nodeMajor -lt 20) {
  Write-Host "Este sistema necesita Node 20 o 22 LTS. Tenés $nodeVersion."
  Write-Host "Instalá Node 22 LTS desde https://nodejs.org (botón verde) y volvé a abrir PowerShell."
  exit 1
}

if (-not (Test-Path ".env")) {
  Copy-Item "env.example" ".env"
  Write-Host "Creé el archivo .env. Abrilo con el Bloc de notas, pegá GYG_GITHUB_TOKEN y GYG_IMGUR_CLIENT_ID, guardá y volvé a correr este script."
  notepad ".env"
  exit 0
}

Write-Host "Instalando dependencias (Node $nodeVersion)..."
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "ERROR: npm install falló. El panel no puede arrancar."
  Write-Host ""
  Write-Host "Si el error menciona better-sqlite3 o Visual Studio:"
  Write-Host "  1. Instalá Node 22 LTS (botón verde) en https://nodejs.org"
  Write-Host "  2. Cerrá PowerShell y abrilo de nuevo"
  Write-Host "  3. En esta carpeta borra node_modules:"
  Write-Host "       Remove-Item -Recurse -Force node_modules"
  Write-Host "  4. Volvé a correr este script"
  Write-Host ""
  Write-Host "Si ves EPERM / OneDrive: cerrá el Explorador de archivos sobre esta carpeta y repetí el paso 3."
  exit 1
}

Write-Host "Iniciando el panel en http://localhost:3000"
npm start
