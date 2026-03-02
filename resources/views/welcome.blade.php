<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor YecaAmigo - Inteligente</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        body {
            background-color: #f4f6f9;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .chat-card {
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            background: white;
            margin-bottom: 15px;
            border-left: 6px solid #ccc;
            transition: transform 0.2s ease;
        }

        .chat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        /* --- COLORES DINÁMICOS --- */
        .area-vialidad {
            border-left-color: #ffc107 !important;
            background-color: #fffdf5;
        }

        .area-policia {
            border-left-color: #dc3545 !important;
            background-color: #fff5f5;
        }

        .area-paramedicos {
            border-left-color: #0dcaf0 !important;
            background-color: #f0fbff;
        }

        .area-pc {
            border-left-color: #fd7e14 !important;
            background-color: #fff8f0;
        }

        /* --- ALERTA DE REPETIDOS --- */
        @keyframes pulse-alert {
            0% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
            }

            70% {
                box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
            }

            100% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
            }
        }

        .urgente-repetido {
            animation: pulse-alert 2s infinite;
            border: 2px solid #dc3545;
        }

        .header-monitor {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 0 0 15px 15px;
        }

        .dato-extra-badge {
            font-size: 0.8rem;
            background-color: #eef2f7;
            color: #444;
            padding: 4px 8px;
            border-radius: 6px;
            margin-right: 5px;
            margin-top: 5px;
            display: inline-block;
            border: 1px solid #dee2e6;
        }
    </style>
</head>

<body>

    <div class="header-monitor text-center shadow-sm">
        <h2 id="titulo-pagina" class="fw-bold"><i class="bi bi-shield-lock-fill"></i> Centro de Mando</h2>
        <div class="mt-2">
            <span id="badge-filtro" class="badge bg-light text-dark">Monitor General</span>
            <span id="status" class="badge bg-secondary ms-2">Conectando...</span>
        </div>
    </div>

    <div class="container">
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
        const socket = io('http://zenta.icu:3001/');
        const lista = document.getElementById('lista-mensajes');
        const statusBadge = document.getElementById('status');
        const tituloPagina = document.getElementById('titulo-pagina');
        const badgeFiltro = document.getElementById('badge-filtro');


        // 🔥 1. DETECTAR ÁREA
        const params = new URLSearchParams(window.location.search);
        const areaActual = params.get('area') ? params.get('area').toLowerCase() : null;

        if (areaActual) {
            tituloPagina.innerHTML = `📡 Monitor: ${areaActual.toUpperCase()}`;
            badgeFiltro.innerText = `Filtrando solo: ${areaActual.toUpperCase()}`;
            badgeFiltro.className = "badge bg-warning text-dark border border-dark";
            document.getElementById('texto-espera').innerText = `Solo se mostrarán incidentes de ${areaActual}.`;
        } else {
            tituloPagina.innerHTML = `🏢 Centro de Mando General`;
            badgeFiltro.innerText = "Mostrando TODO";
            badgeFiltro.className = "badge bg-success";
        }

        let primerMensaje = true;

        socket.on('connect', () => {
            statusBadge.className = "badge bg-success";
            statusBadge.innerText = "En Línea 🟢";
        });

        socket.on('disconnect', () => {
            statusBadge.className = "badge bg-danger";
            statusBadge.innerText = "Desconectado 🔴";
        });

        async function obtenerDatos() {
            try {
                const response = await fetch('https://api.ter-ia.cloud/reportes');
                const datos = await response.json();
                console.log(datos);
                return datos;
            }catch(error){
                console.log('Error al obtener los datos de la API:', error);
                return [];
            }
        }

        function renderizarTarjeta(data) {
            // A. EXTRACCIÓN DE DATOS
            const datosRecolectados = data.datos_recolectados || {};
            const areaEntrante = (data.area || datosRecolectados.area || 'general').toLowerCase().trim();

            // B. FILTRO LÓGICO
            if (areaActual && !areaEntrante.includes(areaActual)) {
                return;
            }

            if (primerMensaje) {
                lista.innerHTML = '';
                primerMensaje = false;
            }

            // C. VARIABLES PRINCIPALES
            const folio = data.folio || 'S/N';
            const fecha = data.fecha || new Date().toLocaleString();
            const nombre = datosRecolectados.nombre || 'Anónimo';
            const tipoReporte = datosRecolectados.tipo_reporte || 'Reporte';
            const ubicacion = datosRecolectados.ubicacion || 'Ubicación no registrada';
            const descripcion = datosRecolectados.descripcion || 'Sin detalles adicionales';
            const datosExtra = datosRecolectados.datos_extra || {};
            const rawPhone = data.telefono || data.phone || datosRecolectados.telefono || 'S/N';
            const telefonoClean = rawPhone.toString().replace(/\D/g, '');

            // D. DUPLICADOS
            const cardId = `incidente-${folio.replace(/\s/g, '')}`;
            const tarjetaExistente = document.getElementById(cardId);

            if (tarjetaExistente) {
                tarjetaExistente.classList.add('urgente-repetido');
                const header = tarjetaExistente.querySelector('.card-header-line');
                if (!header.innerText.includes('REITERADO')) {
                    header.innerHTML += ` <span class="badge bg-danger ms-2">⚠️ REPORTE REITERADO</span>`;
                }
                lista.prepend(tarjetaExistente);
                return;
            }

            // E. ESTILOS VISUALES
            let cssClass = '';
            let iconClass = 'bi-exclamation-circle';
            if (areaEntrante.includes('vialidad') || areaEntrante.includes('transito')) {
                cssClass = 'area-vialidad'; iconClass = 'bi-cone-striped';
            } else if (areaEntrante.includes('policia') || areaEntrante.includes('preventiva')) {
                cssClass = 'area-policia'; iconClass = 'bi-shield-shaded';
            } else if (areaEntrante.includes('paramedico') || areaEntrante.includes('ambulancia')) {
                cssClass = 'area-paramedicos'; iconClass = 'bi-heart-pulse-fill';
            } else if (areaEntrante.includes('civil')) {
                cssClass = 'area-pc'; iconClass = 'bi-fire';
            }

            // F. EXTRAS
            let extrasHTML = '';
            for (const [key, val] of Object.entries(datosExtra)) {
                if (val && val !== 'null') {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let valor = val;
                    if (key.includes('numero') && val.length > 7) {
                        valor = `<a href="https://wa.me/${val.replace(/\D/g, '')}" target="_blank" class="fw-bold text-decoration-none text-dark"><i class="bi bi-whatsapp text-success"></i> ${val}</a>`;
                    }
                    extrasHTML += `<div class="dato-extra-badge"><strong>${label}:</strong> ${valor}</div>`;
                }
            }

            // G. RENDERIZADO DE TARJETA CON TELÉFONO
            const card = document.createElement('div');
            card.id = cardId;
            card.className = `card chat-card p-3 ${cssClass}`;

            const btnWhatsapp = rawPhone !== 'S/N'
                ? `<a href="https://wa.me/${telefonoClean}" target="_blank" class="badge bg-success text-decoration-none mt-1"><i class="bi bi-whatsapp"></i> ${rawPhone}</a>`
                : '<span class="badge bg-secondary mt-1">S/N</span>';

            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start card-header-line">
                    <div>
                        <span class="badge bg-dark rounded-pill">${folio}</span>
                        <span class="badge bg-white text-dark border ms-1">
                            <i class="bi ${iconClass}"></i> ${areaEntrante.toUpperCase()}
                        </span>
                    </div>
                    <div class="text-end lh-1">
                        <small class="fw-bold text-muted" style="font-size: 0.75rem;">${fecha}</small>
                        <br>
                        <small class="text-primary fw-bold" style="font-size: 0.85rem;">👤 ${nombre}</small>
                        <br>
                        ${btnWhatsapp} </div>
                </div>

                <div class="mt-3">
                    <h5 class="fw-bold mb-1">${tipoReporte}</h5>
                    <div class="text-danger mb-2 small"><i class="bi bi-geo-alt-fill"></i> ${ubicacion}</div>
                    
                    <div class="bg-white p-2 border rounded fst-italic text-secondary">
                        "${descripcion}"
                    </div>
                    <div class="mt-2">
                        ${extrasHTML}
                    </div>
                </div>

                <div class="mt-3 d-flex justify-content-end border-top pt-2">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="alert('Ubicación: ${ubicacion}')">Mapa</button>
                    <button class="btn btn-sm btn-primary" onclick="this.closest('.card').remove()">Marcar Atendido</button>
                </div>
            `;

            lista.prepend(card);
        }

        // Cargar datos iniciales de la API
        window.addEventListener('DOMContentLoaded', async () => {
            const reportes = await obtenerDatos();
            if (Array.isArray(reportes)) {
                reportes.forEach(reporte => renderizarTarjeta(reporte));
            }
        });
        
        socket.on('mensaje_whatsapp', (data) => {
            console.log("📥 Payload Socket:", data);
            renderizarTarjeta(data);
        });
    </script>
</body>

</html>