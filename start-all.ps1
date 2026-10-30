# Script para levantar todo el ecosistema TransSync para la sustentación
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "     TRANSSYNC: INICIANDO ECOSISTEMA DE MICROSERVICIOS     " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Infraestructura Docker
Write-Host "`n[1/4] Verificando Contenedores Docker (Postgres, Kafka, Prometheus, Grafana)..." -ForegroundColor Yellow
docker compose up -d postgres-db zookeeper kafka prometheus grafana

# 2. Eureka Server (Registro y Descubrimiento)
Write-Host "`n[2/4] Levantando Eureka Server (:8761)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\eureka-server'; Write-Host '>>> Eureka Server (:8761)' -ForegroundColor Green; mvn spring-boot:run"

Write-Host "Esperando 10 segundos a que Eureka inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 3. Microservicios del Negocio
Write-Host "`n[3/4] Levantando Microservicios y Gateway..." -ForegroundColor Yellow

$servicios = @(
    @{ Name = "API Gateway (:8100) [Swagger Central]"; Dir = "api-gateway" },
    @{ Name = "MS-Auth (:8107)"; Dir = "ms-auth" },
    @{ Name = "MS-Flota (:8102)"; Dir = "ms-flota" },
    @{ Name = "MS-Reservas (:8103) [Resilience4j + Kafka]"; Dir = "ms-reservas" },
    @{ Name = "MS-Pagos (:8104)"; Dir = "ms-pagos" },
    @{ Name = "MS-Promociones (:8105)"; Dir = "ms-promociones" },
    @{ Name = "MS-Fidelizacion (:8106) [Kafka Consumer]"; Dir = "ms-fidelizacion" },
    @{ Name = "MS-Facturacion (:8108) [Kafka Consumer]"; Dir = "ms-facturacion" },
    @{ Name = "MS-Rutas (:8101)"; Dir = "ms-rutas" }
)

foreach ($s in $servicios) {
    Write-Host "Iniciando $($s.Name)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\$($s.Dir)'; Write-Host '>>> $($s.Name)' -ForegroundColor Green; mvn spring-boot:run"
    Start-Sleep -Seconds 3
}

# 4. Frontend Angular
Write-Host "`n[4/4] Levantando Cliente Frontend Angular (:4200)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend-angular'; Write-Host '>>> Frontend Angular (:4200)' -ForegroundColor Green; npm.cmd start"

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "     ¡SISTEMA TRANSSYNC COMPLETAMENTE DESPLEGADO!     " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Accesos Rápidos:" -ForegroundColor White
Write-Host "  - Frontend Web:        http://localhost:4200" -ForegroundColor White
Write-Host "  - Swagger Central:     http://localhost:8100/swagger-ui.html" -ForegroundColor White
Write-Host "  - Eureka Dashboard:    http://localhost:8761" -ForegroundColor White
Write-Host "  - Grafana Dashboard:   http://localhost:8300 (admin/admin)" -ForegroundColor White
Write-Host "  - Prometheus Metrics:  http://localhost:8900" -ForegroundColor White
Write-Host "  - API Gateway:         http://localhost:8100/api" -ForegroundColor White
