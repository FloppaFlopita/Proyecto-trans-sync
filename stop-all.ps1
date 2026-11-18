# Script para detener los procesos de TransSync
Write-Host "Deteniendo procesos Java y Node de TransSync..." -ForegroundColor Yellow

Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Procesos Java y Node terminados." -ForegroundColor Green
Write-Host "Para apagar contenedores docker ejecuta: docker compose stop" -ForegroundColor Cyan

