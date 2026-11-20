param(
    [string]$Servicio
)

$map = @{
    "reservas"    = @{ Puerto = 8103; Nombre = "MS-Reservas" }
    "pagos"       = @{ Puerto = 8104; Nombre = "MS-Pagos" }
    "flota"       = @{ Puerto = 8102; Nombre = "MS-Flota" }
    "rutas"       = @{ Puerto = 8101; Nombre = "MS-Rutas" }
    "facturacion" = @{ Puerto = 8108; Nombre = "MS-Facturación" }
    "1"           = @{ Puerto = 8103; Nombre = "MS-Reservas" }
    "2"           = @{ Puerto = 8104; Nombre = "MS-Pagos" }
    "3"           = @{ Puerto = 8102; Nombre = "MS-Flota" }
    "4"           = @{ Puerto = 8101; Nombre = "MS-Rutas" }
    "5"           = @{ Puerto = 8108; Nombre = "MS-Facturación" }
}

if (-not $Servicio) {
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "   ¿QUE MICROSERVICIO DESEAS APAGAR?          " -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host " 1 - MS-Reservas    (Bloqueo de Asientos)" -ForegroundColor Yellow
    Write-Host " 2 - MS-Pagos       (Mercado Pago / Yape)" -ForegroundColor Yellow
    Write-Host " 3 - MS-Flota       (Buses y Mantenimiento)" -ForegroundColor Yellow
    Write-Host " 4 - MS-Rutas       (Tarifas e Itinerarios)" -ForegroundColor Yellow
    Write-Host " 5 - MS-Facturación (Kafka SUNAT)" -ForegroundColor Yellow
    Write-Host "==============================================" -ForegroundColor Cyan
    $Servicio = Read-Host "Ingresa el numero (1-5) o nombre"
}

$clave = $Servicio.ToLower().Trim()
if ($map.ContainsKey($clave)) {
    $item = $map[$clave]
    Write-Host "`nApagando $($item.Nombre) en puerto $($item.Puerto)..." -ForegroundColor Red
    $conexiones = Get-NetTCPConnection -LocalPort $item.Puerto -ErrorAction SilentlyContinue
    if ($conexiones) {
        $pids = $conexiones | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Write-Host "¡$($item.Nombre) apagado con exito! Revisa Grafana (cambiara a ROJO en 2 segundos)." -ForegroundColor Green
    } else {
        Write-Host "$($item.Nombre) ya estaba apagado." -ForegroundColor Yellow
    }
} else {
    Write-Host "Opcion no valida. Usa: reservas, pagos, flota, rutas o facturacion (o numeros 1 al 5)." -ForegroundColor Red
}
