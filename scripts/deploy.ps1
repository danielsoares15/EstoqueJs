param(
  [string]$OutputPath = ([System.IO.Path]::Combine($PSScriptRoot, '..', 'deploy')),
  [string]$ZipName = "estoque-producao.zip"
)

$Root = Resolve-Path ([System.IO.Path]::Combine($PSScriptRoot, '..'))
$ZipFile = [System.IO.Path]::Combine($OutputPath, $ZipName)
$TempDir = [System.IO.Path]::Combine($OutputPath, "_temp_deploy")

if (!(Test-Path $OutputPath)) {
  New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}

Write-Host "=== Build frontend ===" -ForegroundColor Cyan
Push-Location ([System.IO.Path]::Combine($Root, 'frontend'))
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "=== Montando estrutura de producao ===" -ForegroundColor Cyan

if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }

New-Item -ItemType Directory -Path ([System.IO.Path]::Combine($TempDir, 'backend')) -Force | Out-Null
New-Item -ItemType Directory -Path ([System.IO.Path]::Combine($TempDir, 'frontend')) -Force | Out-Null

# Backend files
$BackendFiles = @('package.json', 'package-lock.json', 'server.js', 'database.js', 'auth.js', '.env.example')
foreach ($f in $BackendFiles) {
  Copy-Item -Path ([System.IO.Path]::Combine($Root, 'backend', $f)) `
            -Destination ([System.IO.Path]::Combine($TempDir, 'backend')) -Force
}

# Backend folders
$BackendDirs = @('routes', 'uploads')
foreach ($d in $BackendDirs) {
  $src = [System.IO.Path]::Combine($Root, 'backend', $d)
  if (Test-Path $src) {
    Copy-Item -Recurse -Path $src -Destination ([System.IO.Path]::Combine($TempDir, 'backend')) -Force
  }
}

# Frontend — fonte + build
$FrontendSrc = @('index.html', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'package.json', 'package-lock.json')
foreach ($f in $FrontendSrc) {
  Copy-Item -Path ([System.IO.Path]::Combine($Root, 'frontend', $f)) `
            -Destination ([System.IO.Path]::Combine($TempDir, 'frontend')) -Force
}
$FrontendDirs = @('src', 'public', 'dist')
foreach ($d in $FrontendDirs) {
  $src = [System.IO.Path]::Combine($Root, 'frontend', $d)
  if (Test-Path $src) {
    Copy-Item -Recurse -Path $src -Destination ([System.IO.Path]::Combine($TempDir, 'frontend')) -Force
  }
}

Write-Host "=== Criando zip ===" -ForegroundColor Cyan
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }

Add-Type -Assembly 'System.IO.Compression.FileSystem'
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $ZipFile, 'Optimal', $false)

Remove-Item -Recurse -Force $TempDir

Write-Host "=== ZIP criado: $ZipFile ===" -ForegroundColor Green
Write-Host ("Tamanho: " + [math]::Round((Get-Item $ZipFile).Length / 1KB) + " KB") -ForegroundColor Green
Write-Host "`nInstrucoes no servidor (Cloud Panel):" -ForegroundColor Yellow
Write-Host "  1. Extraia o zip na pasta do dominio" -ForegroundColor Yellow
Write-Host "  2. cd backend && npm install --omit=dev" -ForegroundColor Yellow
Write-Host "  3. cd ../frontend && npm install --omit=dev" -ForegroundColor Yellow
Write-Host "  4. cd ../frontend && npm run build" -ForegroundColor Yellow
Write-Host "  5. cd ../backend && NODE_ENV=production node server.js" -ForegroundColor Yellow
Write-Host "  (ou use o gerenciador de processos do Cloud Panel apontando para backend/server.js)" -ForegroundColor Yellow
