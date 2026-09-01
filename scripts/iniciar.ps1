# Arranca el panel en esta PC (Windows).
# Uso: doble clic en Iniciar.bat, o:
#   powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function BuscarNpm {
  $cmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $cmd = Get-Command npm -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $usual = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
  if (Test-Path $usual) { return $usual }
  return $null
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "No está Node.js. Instalá la versión LTS (22) en https://nodejs.org"
  Write-Host "Elegí el botón verde LTS, no Current. Cerrá y volvé a abrir esta ventana después."
  Start-Process "https://nodejs.org"
  exit 1
}

$npm = BuscarNpm
if (-not $npm) {
  Write-Host "npm no está en el PATH. Cerrá esta ventana y abrila de nuevo después de instalar Node."
  exit 1
}

$nodeVersion = node -v
$nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
if ($nodeMajor -lt 20) {
  Write-Host "Este sistema necesita Node 20 o 22 LTS. Tenés $nodeVersion."
  Write-Host "Instalá Node 22 LTS desde https://nodejs.org (botón verde)."
  Start-Process "https://nodejs.org"
  exit 1
}
if ($nodeMajor -ge 24) {
  Write-Host "ATENCION: tenés $nodeVersion (Current). Si falla la instalación, usá Node 22 LTS."
}

$cwd = (Get-Location).Path
if ($cwd -match "OneDrive") {
  Write-Host "Esta carpeta está en OneDrive. Si npm falla con EPERM, copiá el proyecto a C:\sistema-concesionaria"
}

if (-not (Test-Path ".env")) {
  Copy-Item "env.example" ".env"
  Write-Host "Creé el archivo .env (opcional). El token de GitHub y la clave ImgBB se pegan en el panel."
}

Write-Host "Instalando dependencias (Node $nodeVersion)..."
& $npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "ERROR: npm install falló. El panel no puede arrancar."
  Write-Host ""
  Write-Host "Si el error menciona better-sqlite3 o Visual Studio:"
  Write-Host "  1. Instalá Node 22 LTS (botón verde) en https://nodejs.org"
  Write-Host "  2. Cerrá esta ventana y abrila de nuevo"
  Write-Host "  3. En esta carpeta borra node_modules y volvé a hacer doble clic en Iniciar.bat"
  Write-Host ""
  Write-Host "Si ves EPERM / OneDrive: copiá la carpeta a C:\sistema-concesionaria y abrí Iniciar.bat ahí."
  exit 1
}

$atajo = Join-Path ([Environment]::GetFolderPath("Desktop")) "Panel de stock.lnk"
if (-not (Test-Path $atajo)) {
  $crearAtajo = Join-Path $PSScriptRoot "crear-acceso-directo.ps1"
  if (Test-Path $crearAtajo) {
    & $crearAtajo
  }
}

Write-Host "Iniciando el panel en http://localhost:3000"
Write-Host "Dejá esta ventana abierta. Para cerrar el sistema, cerrala o apretá Ctrl+C."
Start-Process cmd.exe -ArgumentList "/c", "timeout /t 2 /nobreak >nul & start http://localhost:3000" -WindowStyle Hidden
& $npm start
