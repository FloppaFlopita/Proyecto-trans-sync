# ==============================================================================
# TRANSSYNC: VISUALIZADOR DE EVENTOS EN KAFKA EN TIEMPO REAL
# Muestra los eventos de compras, pagos aprobados y cancelados en vivo
# ==============================================================================

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "         TRANSSYNC: MONITOR DE EVENTOS EN APACHE KAFKA               " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan

Write-Host "`nSeleccione el topico de Kafka que desea inspeccionar:" -ForegroundColor White
Write-Host "  [1] reserva-eventos (Compras confirmadas, Boletas SUNAT emitidas e Idempotencia)" -ForegroundColor Yellow
Write-Host "  [2] pago-eventos    (Transacciones aprobadas por Mercado Pago y Yape)" -ForegroundColor Green
Write-Host "  [3] Ver logs en vivo del Consumidor de Facturacion (MS-Facturacion)" -ForegroundColor Cyan
Write-Host "  [Q] Salir" -ForegroundColor DarkGray

$op = Read-Host "`nOpcion seleccionada"

switch ($op) {
    "1" {
        Write-Host "`nEscuchando eventos en topico 'reserva-eventos' desde el inicio..." -ForegroundColor Yellow
        Write-Host "Presione Ctrl+C para salir.`n" -ForegroundColor DarkGray
        docker exec -it trans-sync-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic reserva-eventos --from-beginning
    }
    "2" {
        Write-Host "`nEscuchando eventos en topico 'pago-eventos' desde el inicio..." -ForegroundColor Green
        Write-Host "Presione Ctrl+C para salir.`n" -ForegroundColor DarkGray
        docker exec -it trans-sync-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic pago-eventos --from-beginning
    }
    "3" {
        Write-Host "`nMostrando traza de eventos en vivo de MS-Facturacion..." -ForegroundColor Cyan
        docker logs -f trans-sync-kafka
    }
    default {
        Write-Host "Saliendo..." -ForegroundColor Gray
    }
}
