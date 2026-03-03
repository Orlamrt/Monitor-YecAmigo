<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor YecaAmigo - Inteligente</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    @vite(['resources/js/app.js','resources/js/cards.js','resources/css/app.css'])
    <style>
        @keyframes pulse-alert {
            0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        .urgente-repetido { animation: pulse-alert 2s infinite; border: 2px solid #dc3545; }
    </style>
</head>

<body class="bg-[#f4f6f9] font-['Segoe_UI',_system-ui,_sans-serif]">

    <div class="absolute top-4 right-4">
        <form action="{{ route('logout') }}" method="POST">
            @csrf
            <button type="submit" class="btn btn-sm btn-danger shadow-sm">
                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </button>
        </form>
    </div>

    <div class="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white p-[20px] mb-[25px] rounded-b-[15px] text-center shadow-sm">
        <h2 id="titulo-pagina" class="fw-bold text-2xl"><i class="bi bi-shield-lock-fill"></i> Centro de Mando</h2>
        <div class="mt-2">
            <span id="badge-filtro" class="badge bg-light text-dark">Monitor General</span>
            <span id="status" class="badge bg-secondary ms-2">Conectando...</span>
        </div>
    </div>

    <div class="container">
        <div class="row mb-4">
            <div class="col-12 d-flex justify-content-center gap-2">
                <button class="btn btn-outline-primary active filter-btn" onclick="filtrarPorStatus('TODOS', this)">Todos</button>
                <button class="btn btn-outline-warning filter-btn" onclick="filtrarPorStatus('PENDIENTE', this)">
                    <i class="bi bi-clock-history"></i> Pendientes
                </button>
                <button class="btn btn-outline-info filter-btn" onclick="filtrarPorStatus('EN_PROCESO', this)">
                    <i class="bi bi-gear-fill"></i> En Proceso
                </button>
                <button class="btn btn-outline-success filter-btn" onclick="filtrarPorStatus('RESUELTO', this)">
                    <i class="bi bi-check-circle-fill"></i> Atendidos
                </button>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-8 col-md-10">
                <div id="lista-mensajes">
                    <div class="text-center text-muted mt-5 py-5 bg-white rounded shadow-sm">
                        <h1 class="display-6">📡</h1>
                        <h4>Esperando reportes...</h4>
                        <p id="texto-espera">El sistema está listo.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>

    <script>
        // Validamos el rol del usuario autenticado de Laravel
        const userRole = "{{ strtolower(Auth::user()->role) }}";
        const params = new URLSearchParams(window.location.search);
        let areaURL = params.get('area') ? params.get('area').toLowerCase() : null;

        // Si no es admin y el área de la URL no es su rol, lo corregimos
        if (userRole === 'general' && areaURL !== null) {
            window.location.href = "{{ route('monitor') }}";
        } else if (userRole !== 'general' && areaURL !== userRole) {
            window.location.href = "{{ route('monitor') }}?area=" + userRole;
        }
        
        // ... resto de tu lógica de sockets y cards ...
    </script>
</body>

</html>