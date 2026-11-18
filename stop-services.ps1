$ports = @(8761, 8100, 8101, 8102, 8103, 8104, 8105, 8106, 8107, 8108, 4200)

Write-Host "Deteniendo procesos en puertos de la aplicacion..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -and $pidToKill -ne 0) {
                Write-Host "Cerrando proceso en puerto $port (PID: $pidToKill)" -ForegroundColor Red
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "Procesos finalizados." -ForegroundColor Green

