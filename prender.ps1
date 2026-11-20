param(
    [string]$Servicio
)

$map = @{
    "reservas"    = @{ Dir = "ms-reservas"; Nombre = "MS-Reservas (:8103)" }
    "pagos"       = @{ Dir = "ms-pagos"; Nombre = "MS-Pagos (:8104)" }
    "flota"       = @{ Dir = "ms-flota"; Nombre = "MS-Flota (:8102)" }
    "rutas"       = @{ Dir = "ms-rutas"; Nombre = "MS-Rutas (:8101)" }
    "facturacion" = @{ Dir = "ms-facturacion"; Nombre = "MS-Facturación (:8108)" }
    "1"           = @{ Dir = "ms-reservas"; Nombre = "MS-Reservas (:8103)" }
    "2"           = @{ Dir = "ms-pagos"; Nombre = "MS-Pagos (:8104)" }
    "3"           = @{ Dir = "ms-flota"; Nombre = "MS-Flota (:8102)" }
    "4"           = @{ Dir = "ms-rutas"; Nombre = "MS-Rutas (:8101)" }
    "5"           = @{ Dir = "ms-facturacion"; Nombre = "MS-Facturación (:8108)" }
}

if (-not $Servicio) {
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "   ¿QUE MICROSERVICIO DESEAS PRENDER?         " -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host " 1 - MS-Reservas" -ForegroundColor Green
    Write-Host " 2 - MS-Pagos" -ForegroundColor Green
    Write-Host " 3 - MS-Flota" -ForegroundColor Green
    Write-Host " 4 - MS-Rutas" -ForegroundColor Green
    Write-Host " 5 - MS-Facturación" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Cyan
    $Servicio = Read-Host "Ingresa el numero (1-5) o nombre"
}

$clave = $Servicio.ToLower().Trim()
if ($map.ContainsKey($clave)) {
    $item = $map[$clave]
    Write-Host "`nIniciando $($item.Nombre) en ventana visible..." -ForegroundColor Green
    Start-Process cmd.exe -ArgumentList "/k title $($item.Nombre) && mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\$($item.Dir)"
    Write-Host "¡Ventana abierta! En 15 segundos pasara a VERDE en Grafana." -ForegroundColor Green
} else {
    Write-Host "Opcion no valida." -ForegroundColor Red
}
