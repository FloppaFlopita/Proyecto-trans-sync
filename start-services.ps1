$java = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot\bin\java.exe"
$baseDir = "C:\Users\SANDRO DRAKE\OneDrive\Desktop\Proyecto\Proyecto-trans-sync"

if (!(Test-Path "$baseDir\logs")) {
    New-Item -ItemType Directory -Path "$baseDir\logs" | Out-Null
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " [1/3] Iniciando Eureka Server (Puerto 8761)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$procEureka = Start-Process -FilePath $java -ArgumentList "-Xms64m -Xmx192m -jar eureka-server/target/eureka-server-0.0.1-SNAPSHOT.jar" -WorkingDirectory $baseDir -RedirectStandardOutput "$baseDir\logs\eureka.log" -RedirectStandardError "$baseDir\logs\eureka-err.log" -PassThru
Write-Host "Eureka iniciado con PID $($procEureka.Id). Esperando 8 segundos..." -ForegroundColor Green
Start-Sleep -Seconds 8

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " [2/3] Iniciando Microservicios de Negocio y Gateway" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$services = @(
  @{ name="ms-auth"; jar="ms-auth/target/ms-auth-0.0.1-SNAPSHOT.jar"; port=8107 },
  @{ name="ms-rutas"; jar="ms-rutas/target/ms-rutas-0.0.1-SNAPSHOT.jar"; port=8101 },
  @{ name="ms-flota"; jar="ms-flota/target/ms-flota-0.0.1-SNAPSHOT.jar"; port=8102 },
  @{ name="ms-reservas"; jar="ms-reservas/target/ms-reservas-0.0.1-SNAPSHOT.jar"; port=8103 },
  @{ name="ms-pagos"; jar="ms-pagos/target/ms-pagos-0.0.1-SNAPSHOT.jar"; port=8104 },
  @{ name="ms-facturacion"; jar="ms-facturacion/target/ms-facturacion-0.0.1-SNAPSHOT.jar"; port=8108 },
  @{ name="ms-fidelizacion"; jar="ms-fidelizacion/target/ms-fidelizacion-0.0.1-SNAPSHOT.jar"; port=8106 },
  @{ name="ms-promociones"; jar="ms-promociones/target/ms-promociones-0.0.1-SNAPSHOT.jar"; port=8105 },
  @{ name="api-gateway"; jar="api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar"; port=8100 }
)

$procs = @($procEureka)

foreach ($svc in $services) {
    Write-Host "Iniciando $($svc.name) en puerto $($svc.port)..." -ForegroundColor Yellow
    $p = Start-Process -FilePath $java -ArgumentList "-Xms64m -Xmx192m -jar $($svc.jar)" -WorkingDirectory $baseDir -RedirectStandardOutput "$baseDir\logs\$($svc.name).log" -RedirectStandardError "$baseDir\logs\$($svc.name)-err.log" -PassThru
    $procs += $p
    Start-Sleep -Seconds 2
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host " Todos los microservicios estan en ejecucion!" -ForegroundColor Green
Write-Host " PIDs activos: $($procs.Id -join ', ')" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Mantener vivo el proceso padre para que los procesos hijos se mantengan activos
while ($true) {
    Start-Sleep -Seconds 30
}

