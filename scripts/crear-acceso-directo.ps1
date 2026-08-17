# Crea un acceso directo en el Escritorio que abre Iniciar.bat
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$iniciar = Join-Path $raiz "Iniciar.bat"
$escritorio = [Environment]::GetFolderPath("Desktop")
$atajo = Join-Path $escritorio "G&G Automotores.lnk"

if (-not (Test-Path $iniciar)) {
  Write-Host "No encontré Iniciar.bat en $raiz"
  exit 1
}

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($atajo)
$sc.TargetPath = $iniciar
$sc.WorkingDirectory = $raiz
$sc.WindowStyle = 1
$sc.Description = "Panel de stock G&G Automotores"
$sc.Save()
Write-Host "Acceso directo creado en el Escritorio: G&G Automotores"
