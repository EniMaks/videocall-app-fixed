# start-turn-server.ps1 - PowerShell script to start Coturn TURN server for local development
# Usage: .\start-turn-server.ps1

Write-Host "🚀 Starting Coturn TURN server for local development..." -ForegroundColor Green

# Check if turnserver is available
$turnserverCmd = Get-Command turnserver -ErrorAction SilentlyContinue
if (-not $turnserverCmd) {
    Write-Host "❌ Coturn is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Coturn first:" -ForegroundColor Yellow
    Write-Host "  - Via Chocolatey: choco install coturn" -ForegroundColor Yellow
    Write-Host "  - Download from: https://github.com/coturn/coturn/releases" -ForegroundColor Yellow
    exit 1
}

# Check if config file exists
$configPath = Join-Path $PSScriptRoot "coturn/turnserver.conf"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Coturn config file not found at $configPath" -ForegroundColor Red
    exit 1
}

# Start TURN server
Write-Host "🔧 Starting TURN server on port 3478..." -ForegroundColor Cyan
Write-Host "📝 Config: $configPath" -ForegroundColor Cyan
Write-Host "👤 User: turnuser:supersecretturnpassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run turnserver
& turnserver -c $configPath --user=turnuser:supersecretturnpassword