param(
    [Parameter(Mandatory=$true)]
    [int]$Puerto
)

Write-Host "Buscando proceso escuchando en el puerto $Puerto..." -ForegroundColor Yellow

$conexiones = Get-NetTCPConnection -LocalPort $Puerto -ErrorAction SilentlyContinue

if ($conexiones) {
    $pids = $conexiones | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        try {
            $proc = Get-Process -Id $p -ErrorAction Stop
            Write-Host "Deteniendo proceso: $($proc.ProcessName) (PID: $p) en puerto $Puerto" -ForegroundColor Red
            Stop-Process -Id $p -Force
            Write-Host "Proceso terminado con exito." -ForegroundColor Green
        } catch {
            Write-Host "No se pudo terminar el proceso PID $p: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No hay ningun proceso escuchando en el puerto $Puerto." -ForegroundColor Cyan
}
