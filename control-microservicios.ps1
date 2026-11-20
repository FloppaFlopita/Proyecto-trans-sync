# ==============================================================================
# TRANSSYNC: PANEL DE CONTROL Y GESTION INDIVIDUAL DE MICROSERVICIOS
# Permite levantar, monitorear y detener cada servicio de forma independiente
# ==============================================================================

function Obtener-EstadoPuerto {
    param([int]$Puerto)
    $conn = Get-NetTCPConnection -LocalPort $Puerto -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn -and ($conn.State -eq 'Listen' -or $conn.State -eq 'Established')) {
        return $true
    }
    return $false
}

function Iniciar-VentanaServicio {
    param(
        [string]$Titulo,
        [string]$Directorio,
        [string]$Comando
    )
    $rutaCompleta = Join-Path $PSScriptRoot $Directorio
    Write-Host "Iniciando $Titulo en ventana independiente..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$rutaCompleta'; `$Host.UI.RawUI.WindowTitle = '$Titulo'; Write-Host '>>> INICIANDO: $Titulo' -ForegroundColor Green; $Comando"
}

function Matar-ServicioPorPuerto {
    param([int]$Puerto)
    Write-Host "Verificando procesos en puerto $Puerto..." -ForegroundColor Yellow
    $conexiones = Get-NetTCPConnection -LocalPort $Puerto -ErrorAction SilentlyContinue
    if ($conexiones) {
        $pids = $conexiones | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            try {
                $proc = Get-Process -Id $p -ErrorAction Stop
                Write-Host "Terminando proceso $($proc.ProcessName) (PID $p) en puerto $Puerto..." -ForegroundColor Red
                Stop-Process -Id $p -Force
                Write-Host "Proceso terminado con exito." -ForegroundColor Green
            } catch {
                Write-Host "Error al terminar proceso: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No se encontro ningun servicio activo en el puerto $Puerto." -ForegroundColor Cyan
    }
}

do {
    Clear-Host
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "          TRANSSYNC - PANEL DE CONTROL DE MICROSERVICIOS              " -ForegroundColor Cyan
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host ""

    # Matriz de Servicios
    $servicios = @(
        @{ Id = "1";  Nombre = "Eureka Service Discovery";   Puerto = 8761;  Dir = "eureka-server";    Cmd = "mvn spring-boot:run" },
        @{ Id = "2";  Nombre = "MS-Reservas (Bloqueo/Asientos)"; Puerto = 8103;  Dir = "ms-reservas";     Cmd = "mvn spring-boot:run" },
        @{ Id = "3";  Nombre = "MS-Pagos (Mercado Pago)";    Puerto = 8104;  Dir = "ms-pagos";         Cmd = "mvn spring-boot:run" },
        @{ Id = "4";  Nombre = "MS-Facturacion (Kafka SUNAT)"; Puerto = 8108;  Dir = "ms-facturacion";   Cmd = "mvn spring-boot:run" },
        @{ Id = "5";  Nombre = "MS-Flota (Buses/Mantenimiento)"; Puerto = 8102; Dir = "ms-flota";        Cmd = "mvn spring-boot:run" },
        @{ Id = "6";  Nombre = "MS-Rutas (Itinerarios/Tarifas)"; Puerto = 8101; Dir = "ms-rutas";        Cmd = "mvn spring-boot:run" },
        @{ Id = "7";  Nombre = "MS-Auth (Seguridad/JWT)";    Puerto = 8107;  Dir = "ms-auth";          Cmd = "mvn spring-boot:run" },
        @{ Id = "8";  Nombre = "API Gateway Spring Boot";     Puerto = 8080;  Dir = "api-gateway";      Cmd = "mvn spring-boot:run" },
        @{ Id = "9";  Nombre = "TransSync Node Gateway";     Puerto = 8100;  Dir = ".";                Cmd = "node transsync-backend-server.js" },
        @{ Id = "10"; Nombre = "Frontend Angular (Web UI)";  Puerto = 4200;  Dir = "frontend-angular"; Cmd = "npm.cmd start" }
    )

    Write-Host "ESTADO ACTUAL DE LOS SERVICIOS:" -ForegroundColor White
    Write-Host "-----------------------------------------------------------------------" -ForegroundColor DarkGray

    foreach ($s in $servicios) {
        $activo = Obtener-EstadoPuerto -Puerto $s.Puerto
        $estadoTexto = if ($activo) { "[ONLINE] " } else { "[OFFLINE]" }
        $color = if ($activo) { "Green" } else { "DarkGray" }
        Write-Host ("  {0,2}. {1,-34} (: {2,4}) -> " -f $s.Id, $s.Nombre, $s.Puerto) -NoNewline
        Write-Host $estadoTexto -ForegroundColor $color
    }

    Write-Host ""
    Write-Host "INFRAESTRUCTURA DE SOPORTE (DOCKER):" -ForegroundColor White
    Write-Host "-----------------------------------------------------------------------" -ForegroundColor DarkGray
    $infra = @(
        @{ Nombre = "PostgreSQL 15 Database"; Puerto = 8543 },
        @{ Nombre = "Apache Kafka Broker";   Puerto = 29092 },
        @{ Nombre = "Prometheus Metrics";     Puerto = 8900 },
        @{ Nombre = "Grafana Dashboards";     Puerto = 8300 }
    )
    foreach ($inf in $infra) {
        $activo = Obtener-EstadoPuerto -Puerto $inf.Puerto
        $estadoTexto = if ($activo) { "[ONLINE] " } else { "[OFFLINE]" }
        $color = if ($activo) { "Cyan" } else { "DarkGray" }
        Write-Host ("      {0,-34} (: {1,4}) -> " -f $inf.Nombre, $inf.Puerto) -NoNewline
        Write-Host $estadoTexto -ForegroundColor $color
    }

    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "ACCIONES DISPONIBLES:" -ForegroundColor White
    Write-Host " [1-10] Iniciar el servicio seleccionado en una ventana PowerShell" -ForegroundColor Yellow
    Write-Host " [D]    Iniciar contenedores Docker (Postgres, Kafka, Prometheus, Grafana)" -ForegroundColor Yellow
    Write-Host " [K]    MATAR un microservicio especifico por puerto (Para prueba de resiliencia)" -ForegroundColor Magenta
    Write-Host " [A]    Iniciar TODOS los microservicios en ventanas separadas" -ForegroundColor Green
    Write-Host " [X]    Detener TODOS los procesos Java y Node" -ForegroundColor Red
    Write-Host " [R]    Refrescar estado de los puertos" -ForegroundColor White
    Write-Host " [Q]    Salir del menu" -ForegroundColor DarkGray
    Write-Host "=======================================================================" -ForegroundColor Cyan

    $opcion = Read-Host "Seleccione una opcion"

    switch ($opcion.ToUpper()) {
        "1"  { Iniciar-VentanaServicio -Titulo "Eureka Server (:8761)" -Directorio "eureka-server" -Comando "mvn spring-boot:run" }
        "2"  { Iniciar-VentanaServicio -Titulo "MS-Reservas (:8103)" -Directorio "ms-reservas" -Comando "mvn spring-boot:run" }
        "3"  { Iniciar-VentanaServicio -Titulo "MS-Pagos (:8104)" -Directorio "ms-pagos" -Comando "mvn spring-boot:run" }
        "4"  { Iniciar-VentanaServicio -Titulo "MS-Facturacion (:8108)" -Directorio "ms-facturacion" -Comando "mvn spring-boot:run" }
        "5"  { Iniciar-VentanaServicio -Titulo "MS-Flota (:8102)" -Directorio "ms-flota" -Comando "mvn spring-boot:run" }
        "6"  { Iniciar-VentanaServicio -Titulo "MS-Rutas (:8101)" -Directorio "ms-rutas" -Comando "mvn spring-boot:run" }
        "7"  { Iniciar-VentanaServicio -Titulo "MS-Auth (:8107)" -Directorio "ms-auth" -Comando "mvn spring-boot:run" }
        "8"  { Iniciar-VentanaServicio -Titulo "API Gateway (:8080)" -Directorio "api-gateway" -Comando "mvn spring-boot:run" }
        "9"  { Iniciar-VentanaServicio -Titulo "TransSync Node Gateway (:8100)" -Directorio "." -Comando "node transsync-backend-server.js" }
        "10" { Iniciar-VentanaServicio -Titulo "Frontend Angular (:4200)" -Directorio "frontend-angular" -Comando "npm.cmd start" }
        "D"  {
            Write-Host "Levantando Docker Compose..." -ForegroundColor Cyan
            docker compose up -d postgres-db zookeeper kafka prometheus grafana
            Start-Sleep -Seconds 3
        }
        "K"  {
            $pt = Read-Host "Ingrese el puerto del servicio que desea matar (ej: 8103 para Reservas)"
            if ($pt) {
                Matar-ServicioPorPuerto -Puerto [int]$pt
                Start-Sleep -Seconds 2
            }
        }
        "A"  {
            Write-Host "Iniciando todos los servicios mediante start-all.ps1..." -ForegroundColor Green
            & "$PSScriptRoot\start-all.ps1"
            Start-Sleep -Seconds 4
        }
        "X"  {
            Write-Host "Deteniendo procesos Java y Node..." -ForegroundColor Red
            Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "Procesos detenidos." -ForegroundColor Green
            Start-Sleep -Seconds 2
        }
        "R"  {
            # Solo refresca el bucle
        }
        "Q"  {
            break
        }
        default {
            Write-Host "Opcion no valida." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }

} while ($opcion.ToUpper() -ne "Q")
