/* Documento de conexión de sockets y construcción de Cards */

// Inicialización del socket y elementos de la web
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
} else {
    tituloPagina.innerHTML = `🏢 Centro de Mando General`;
    badgeFiltro.innerText = "Mostrando TODO";
    badgeFiltro.className = "badge bg-success";
}

let primerMensaje = true;

/* Sockets para verificar conexión */
socket.on('connect', () => {
    statusBadge.className = "badge bg-success";
    statusBadge.innerText = "En Línea 🟢";
});

socket.on('disconnect', () => {
    statusBadge.className = "badge bg-danger";
    statusBadge.innerText = "Desconectado 🔴";
});

/* Función para obtener datos de la API */
async function obtenerDatos() {
    try {
        const response = await fetch('https://api.ter-ia.cloud/reportes');
        const datos = await response.json();
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error('Error al obtener los datos de la API:', error);
        return [];
    }
}

/* Construcción de las cards del reporte */
function renderizarTarjeta(data) {
    // 1. FILTRO POR STATUS (Corregido: toUpperCase)
    // Solo mostramos si es PENDIENTE. Si es otra cosa, ignoramos.
    if (data.status_atencion && data.status_atencion.toUpperCase() !== 'PENDIENTE') {
        return;
    }

    // 2. EXTRACCIÓN DE DATOS SEGÚN TU ARRAY
    const datosRecolectados = data.datos_recolectados || {};
    
    // Prioridad: data.area > datos_recolectados.departamento > 'general'
    const areaEntrante = (data.area || datosRecolectados.departamento || 'general').toLowerCase().trim();

    // 3. FILTRO POR ÁREA (URL Params)
    if (areaActual && !areaEntrante.includes(areaActual)) {
        return;
    }

    if (primerMensaje) {
        lista.innerHTML = '';
        primerMensaje = false;
    }

    // 4. VARIABLES PRINCIPALES
    const folio = data.folio || 'S/N';
    const fecha = data.fecha || new Date().toLocaleString();
    const nombre = datosRecolectados.nombre || 'Anónimo';
    const tipoReporte = datosRecolectados.tipo_reporte || 'Reporte';
    const ubicacion = datosRecolectados.ubicacion || 'Ubicación no registrada';
    const descripcion = datosRecolectados.descripcion || 'Sin detalles adicionales';
    const datosExtra = datosRecolectados.datos_extra || {};
    const rawPhone = data.telefono || data.phone || datosRecolectados.telefono || 'S/N';
    const telefonoClean = rawPhone.toString().replace(/\D/g, '');

    // 5. CONTROL DE DUPLICADOS
    const cardId = `incidente-${folio.replace(/\s/g, '')}`;
    if (document.getElementById(cardId)) {
        const tarjetaExistente = document.getElementById(cardId);
        tarjetaExistente.classList.add('urgente-repetido');
        lista.prepend(tarjetaExistente);
        return;
    }

    // 6. ESTILOS VISUALES (Usando tus clases de Tailwind/Bootstrap)
    let cssClass = '';
    let iconClass = 'bi-exclamation-circle';
    
    if (areaEntrante.includes('transito') || areaEntrante.includes('vialidad')) {
        cssClass = 'border-l-4 border-orange-500 bg-orange-50'; iconClass = 'bi-cone-striped';
    } else if (areaEntrante.includes('policia')) {
        cssClass = 'border-l-4 border-blue-600 bg-blue-50'; iconClass = 'bi-shield-shaded';
    } else if (areaEntrante.includes('paramedico') || areaEntrante.includes('ambulancia')) {
        cssClass = 'border-l-4 border-red-500 bg-red-50'; iconClass = 'bi-heart-pulse-fill';
    } else if (areaEntrante.includes('civil')) {
        cssClass = 'border-l-4 border-yellow-500 bg-yellow-50'; iconClass = 'bi-fire';
    }

    // 7. RENDERIZADO
    const card = document.createElement('div');
    card.id = cardId;
    card.className = `card chat-card p-3 mb-3 shadow-sm ${cssClass}`;

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
                <small class="fw-bold text-muted" style="font-size: 0.75rem;">${fecha}</small><br>
                <small class="text-primary fw-bold" style="font-size: 0.85rem;">👤 ${nombre}</small><br>
                ${btnWhatsapp}
            </div>
        </div>
        <div class="mt-3">
            <h5 class="fw-bold mb-1">${tipoReporte}</h5>
            <div class="text-danger mb-2 small"><i class="bi bi-geo-alt-fill"></i> ${ubicacion}</div>
            <div class="bg-white p-2 border rounded fst-italic text-secondary">"${descripcion}"</div>
        </div>
        <div class="mt-3 d-flex justify-content-end border-top pt-2">
            <button class="btn btn-sm btn-primary" onclick="this.closest('.card').remove()">Marcar Atendido</button>
        </div>
    `;

    lista.prepend(card);
}

// Cargar datos iniciales
window.addEventListener('DOMContentLoaded', async () => {
    const reportes = await obtenerDatos();
    
    // Ordenar por fecha (asumiendo formato ISO o comparable) de más antiguo a más reciente
    // para que al usar .prepend() en renderizarTarjeta, el más reciente quede arriba.
    const reportesOrdenados = reportes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    reportesOrdenados.forEach(reporte => renderizarTarjeta(reporte));
});

// Escuchar Socket
socket.on('mensaje_whatsapp', (data) => {
    console.log("📥 Payload Socket:", data);
    renderizarTarjeta(data);
});

console.log(obtenerDatos());