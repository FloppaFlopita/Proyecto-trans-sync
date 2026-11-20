# ==============================================================================
# TRANSSYNC: SCRIPT OFICIAL PARA LEVANTAR TODO EL ECOSISTEMA TRAS REINICIO
# ==============================================================================

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "           TRANSSYNC: LEVANTANDO ECOSISTEMA COMPLETO                  " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan

# 1. Levantar Contenedores Docker
Write-Host "`n[1/4] Iniciando Contenedores Docker (Postgres, Kafka, Kafka-UI, Prometheus, Grafana)..." -ForegroundColor Yellow
docker compose up -d postgres-db zookeeper kafka kafka-ui prometheus grafana

# 2. Levantar Eureka Server
Write-Host "`n[2/4] Levantando Eureka Server (:8761) en ventana visible..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$PSScriptRoot\eureka-server'; `$Host.UI.RawUI.WindowTitle = 'Eureka Server (:8761)'; Write-Host '>>> Eureka Server (:8761)' -ForegroundColor Green; mvn spring-boot:run"

Write-Host "Esperando 8 segundos a que Eureka inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# 3. Levantar Microservicios en Ventanas Independientes de PowerShell
Write-Host "`n[3/4] Levantando Microservicios de Negocio..." -ForegroundColor Yellow

$servicios = @(
    @{ Name = "TransSync Backend Gateway (:8100) [Mercado Pago + SSE]"; Dir = "."; Cmd = "node transsync-backend-server.js" },
    @{ Name = "MS-Rutas (:8101) [Tarifas e Itinerarios]"; Dir = "ms-rutas"; Cmd = "mvn spring-boot:run" },
    @{ Name = "MS-Flota (:8102) [Buses y Mantenimiento]"; Dir = "ms-flota"; Cmd = "mvn spring-boot:run" },
    @{ Name = "MS-Reservas (:8103) [Bloqueo de Asientos]"; Dir = "ms-reservas"; Cmd = "mvn spring-boot:run" },
    @{ Name = "MS-Pagos (:8104) [Mercado Pago Pasarela]"; Dir = "ms-pagos"; Cmd = "mvn spring-boot:run" },
    @{ Name = "MS-Facturacion (:8108) [Kafka SUNAT]"; Dir = "ms-facturacion"; Cmd = "mvn spring-boot:run" },
    @{ Name = "MS-Auth (:8107) [Seguridad y JWT]"; Dir = "ms-auth"; Cmd = "mvn spring-boot:run" }
)

foreach ($s in $servicios) {
    Write-Host "Iniciando $($s.Name)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$PSScriptRoot\$($s.Dir)'; `$Host.UI.RawUI.WindowTitle = '$($s.Name)'; Write-Host '>>> $($s.Name)' -ForegroundColor Green; $($s.Cmd)"
    Start-Sleep -Seconds 2
}

# 4. Levantar Frontend Angular
Write-Host "`n[4/4] Levantando Frontend Angular (:4200) en ventana visible..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$PSScriptRoot\frontend-angular'; `$Host.UI.RawUI.WindowTitle = 'Frontend Angular (:4200)'; Write-Host '>>> Frontend Angular (:4200)' -ForegroundColor Green; npm.cmd start"

Write-Host "`n=======================================================================" -ForegroundColor Cyan
Write-Host "         ¡SISTEMA TRANSSYNC COMPLETAMENTE DESPLEGADO!                 " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "ENLACES RÁPIDOS WEB:" -ForegroundColor White
Write-Host "  - Frontend Web:        http://localhost:4200" -ForegroundColor White
Write-Host "  - Grafana (Monitoreo): http://localhost:8300 (admin / admin)" -ForegroundColor White
Write-Host "  - Kafka Web UI:        http://localhost:8089" -ForegroundColor White
Write-Host "  - Eureka Dashboard:    http://localhost:8761" -ForegroundColor White
Write-Host "  - Prometheus Métricas: http://localhost:8900" -ForegroundColor White
Write-Host "  - Gateway API:         http://localhost:8100/api" -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Cyan
