/* Documento de conexión de sockets y construcción de Cards */

const socket = io('https://api.zenta.icu/');
const lista = document.getElementById('lista-mensajes');
const statusBadge = document.getElementById('status');
const tituloPagina = document.getElementById('titulo-pagina');
const badgeFiltro = document.getElementById('badge-filtro');

// --- ESTADO GLOBAL ---
let todosLosReportes = []; // Aquí guardaremos todo lo que llegue
let filtroStatusActual = 'TODOS'; 

const params = new URLSearchParams(window.location.search);
const areaActual = params.get('area') ? params.get('area').toLowerCase() : null;

// Configuración inicial de UI
if (areaActual) {
    tituloPagina.innerHTML = `📡 Monitor: ${areaActual.toUpperCase()}`;
    badgeFiltro.innerText = `Filtrando solo: ${areaActual.toUpperCase()}`;
    badgeFiltro.className = "badge bg-warning text-dark border border-dark";
}

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

// --- FUNCIÓN DE FILTRADO PARA LOS BOTONES ---
window.filtrarPorStatus = function(status, btnElement) {
    filtroStatusActual = status;
    
    // Actualizar estilos de botones
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    // Limpiar lista y volver a renderizar desde la memoria
    lista.innerHTML = '';
    
    // Ordenar para que el más reciente siempre esté arriba al renderizar
    const reportesParaMostrar = [...todosLosReportes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    reportesParaMostrar.forEach(reporte => renderizarTarjeta(reporte));
    
    if (lista.innerHTML === '') {
        lista.innerHTML = `<div class="text-center text-muted mt-5">No hay reportes con estatus: ${status}</div>`;
    }
};

/* Construcción de las cards del reporte */
function renderizarTarjeta(data) {
    // 1. FILTRO POR STATUS (Lógica de los botones)
    // si no viene estado desde el webhook lo tratamos como pendiente para que salga con botones
    const statusReporte = (data.status_atencion || 'PENDIENTE').toUpperCase().replace(' ', '_');
    const filtroNormalizado = filtroStatusActual.toUpperCase().replace(' ', '_');

    if (filtroNormalizado !== 'TODOS' && statusReporte !== filtroNormalizado) {
        return;
    }

    // 2. EXTRACCIÓN DE DATOS
    const datosRecolectados = data.datos_recolectados || {};
    const areaEntrante = (data.area || datosRecolectados.departamento || 'general').toLowerCase().trim();

    // 3. FILTRO POR ÁREA (URL Params)
    if (areaActual && !areaEntrante.includes(areaActual)) {
        return;
    }

    // 4. VARIABLES PRINCIPALES
    const folio = data.folio || 'S/N';
    const fecha = data.fecha || new Date().toLocaleString();
    const nombre = datosRecolectados.nombre || 'Anónimo';
    const tipoReporte = datosRecolectados.tipo_reporte || 'Reporte';
    const ubicacion = datosRecolectados.ubicacion || 'Ubicación no registrada';
    const descripcion = datosRecolectados.descripcion || 'Sin detalles adicionales';
    const rawPhone = data.telefono || data.phone || datosRecolectados.telefono || 'S/N';
    const telefonoClean = rawPhone.toString().replace(/\D/g, '');

    // 5. CONTROL DE DUPLICADOS (Solo si estamos en modo "TODOS" o tiempo real)
    const cardId = `incidente-${folio.replace(/\s/g, '')}`;
    const existingCard = document.getElementById(cardId);
    if (existingCard) {
        // Si ya existía un reporte con ese folio lo marcamos como urgente.
        // Eliminamos la tarjeta vieja para volver a crearla (se añadirá de nuevo más abajo)
        existingCard.remove();
        data.reporteUrgente = true;
    }

    // 6. ESTILOS VISUALES
    let cssClass = 'border-l-4 border-gray-300 bg-white';
    let iconClass = 'bi-exclamation-circle';
    
    // estilos por área
    if (areaEntrante.includes('transito') || areaEntrante.includes('vialidad')) {
        cssClass = 'border-l-4 border-orange-500 bg-orange-50'; iconClass = 'bi-cone-striped';
    } else if (areaEntrante.includes('policia')) {
        cssClass = 'border-l-4 border-blue-600 bg-blue-50'; iconClass = 'bi-shield-shaded';
    } else if (areaEntrante.includes('paramedico') || areaEntrante.includes('ambulancia')) {
        cssClass = 'border-l-4 border-red-500 bg-red-50'; iconClass = 'bi-heart-pulse-fill';
    } else if (areaEntrante.includes('civil')) {
        cssClass = 'border-l-4 border-yellow-500 bg-yellow-50'; iconClass = 'bi-fire';
    }

    // si marcamos como urgente a causa de un duplicado
    if (data.reporteUrgente) {
        cssClass = 'border-l-4 border-red-700 bg-red-100';
        iconClass = 'bi-exclamation-triangle-fill';
    }

    // Badge de status visual
    let statusBadgeHTML = '<span class="badge bg-warning text-dark ms-1">PENDIENTE</span>';
    if (statusReporte === 'EN_PROCESO') {
        statusBadgeHTML = '<span class="badge bg-info text-dark ms-1">EN PROCESO</span>';
    } else if (statusReporte === 'RESUELTO') {
        statusBadgeHTML = '<span class="badge bg-success ms-1">ATENDIDO</span>';
    }
    // cuando el reporte se regenera por duplicado lo tratamos como urgente
    if (data.reporteUrgente) {
        statusBadgeHTML = '<span class="badge bg-danger text-white ms-1">REPORTE SIN ATENDER</span>';
    }

    // 7. prepare action buttons based on status
    let actionsHTML = '';
    if (statusReporte === 'PENDIENTE') {
        // show both transition options
        actionsHTML = `
            <form onsubmit="event.preventDefault(); actualizarStatus('${folio}', 'EN_PROCESO'); this.closest('.card').remove(); ">
                <button type="submit" class="btn btn-sm btn-info me-2">Marcar como EN PROCESO</button>
            </form>
            <form onsubmit="event.preventDefault(); actualizarStatus('${folio}', 'RESUELTO'); this.closest('.card').remove();">
                <button type="submit" class="btn btn-sm btn-success">Marcar como ATENDIDO</button>
            </form>
        `;
    } else if (statusReporte === 'EN_PROCESO') {
        // only allow marking as resolved
        actionsHTML = `
            <form onsubmit="event.preventDefault(); actualizarStatus('${folio}', 'RESUELTO'); this.closest('.card').remove();">
                <button type="submit" class="btn btn-sm btn-success">Marcar como ATENDIDO</button>
            </form>
        `;
    } 

    const card = document.createElement('div');
    card.id = cardId;
    card.className = `card chat-card p-3 mb-3 shadow-sm ${cssClass}`;

    // si es urgente insertamos un banner arriba
    if (data.reporteUrgente) {
        const aviso = document.createElement('div');
        aviso.className = 'text-center text-danger fw-bold mb-2';
        aviso.innerText = '🚨 URGENTE';
        card.appendChild(aviso);
    }


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
                ${statusBadgeHTML}
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
            ${actionsHTML}
        </div>
    `;

    lista.prepend(card);
}

// Cargar datos iniciales
window.addEventListener('DOMContentLoaded', async () => {
    const reportes = await obtenerDatos();
    todosLosReportes = reportes; 
    
    // Renderizado inicial
    filtrarPorStatus('TODOS');
});

// Escuchar Socket
socket.on('mensaje_whatsapp', (data) => {
    console.log("📥 Payload Socket:", data);
    todosLosReportes.push(data);
    renderizarTarjeta(data);     
});