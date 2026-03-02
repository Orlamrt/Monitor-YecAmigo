/* Documento de conexi[on de sockets y construcción de Cards */
/* Si lees esto se trato de  dejar todo a la compresión posible gracias por el entendimiento */ 


        /* Inicialización del sockect y elemento de la web */
       const socket = io('http://zenta.icu:3001/');
        const lista = document.getElementById('lista-mensajes');
        const statusBadge = document.getElementById('status');
        const tituloPagina = document.getElementById('titulo-pagina');
        const badgeFiltro = document.getElementById('badge-filtro');


        // Clasificación de áreas de departamentos
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

        /* Sockets par verificar si hay conexión con el web socket  */
        socket.on('connect', () => {
            statusBadge.className = "badge bg-success";
            statusBadge.innerText = "En Línea 🟢";
        });

        socket.on('disconnect', () => {
            statusBadge.className = "badge bg-danger";
            statusBadge.innerText = "Desconectado 🔴";
        });

        /* Función para obtener datos de la API (endpoint) */
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

        /* Construción de las cards del reporte */

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
                cssClass = 'border-l-4 border-orange-500 bg-orange-50'; iconClass = 'bi-cone-striped';
            } else if (areaEntrante.includes('policia') || areaEntrante.includes('preventiva')) {
                cssClass = 'border-l-4 border-blue-600 bg-blue-50'; iconClass = 'bi-shield-shaded';
            } else if (areaEntrante.includes('paramedico') || areaEntrante.includes('ambulancia')) {
                cssClass = 'border-l-4 border-red-500 bg-red-50'; iconClass = 'bi-heart-pulse-fill';
            } else if (areaEntrante.includes('civil')) {
                cssClass = 'border-l-4 border-yellow-500 bg-yellow-50'; iconClass = 'bi-fire';
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