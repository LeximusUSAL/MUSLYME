/**
 * Sistema de etiquetado de imágenes ONDAS
 * Para añadir nuevas etiquetas, edita el array ETIQUETAS
 */

// ETIQUETAS DISPONIBLES
// - id: identificador interno
// - nombres: sinónimos para búsqueda (el primero es el principal)
// - label: texto que se muestra en la interfaz
const ETIQUETAS = [
    { id: 'cascos', nombres: ['cascos', 'auriculares'], label: 'Cascos/Auriculares' },
    { id: 'microfono', nombres: ['micrófono', 'microfono', 'micro'], label: 'Micrófono' },
    { id: 'altavoz', nombres: ['altavoz', 'altavoces', 'speaker'], label: 'Altavoz' }
];

// Cargar etiquetas guardadas del localStorage
function cargarEtiquetasGuardadas(categoria) {
    const guardadas = localStorage.getItem(`ondas_tags_${categoria}`);
    return guardadas ? JSON.parse(guardadas) : {};
}

// Guardar etiquetas en localStorage
function guardarEtiquetas(categoria, etiquetas) {
    localStorage.setItem(`ondas_tags_${categoria}`, JSON.stringify(etiquetas));
}

// Inicializar la página de administración
function inicializarAdmin(categoria, imagenes) {
    const container = document.getElementById('imagenes-container');
    const etiquetasGuardadas = cargarEtiquetasGuardadas(categoria);

    // Crear encabezado de etiquetas
    const headerHTML = `
        <div class="admin-header">
            <h1>Etiquetado: ${categoria.toUpperCase()}</h1>
            <p>${imagenes.length} imágenes en esta categoría</p>
            <div class="admin-actions">
                <button onclick="guardarTodo('${categoria}')" class="btn-guardar">Guardar cambios</button>
                <button onclick="exportarJSON()" class="btn-exportar">Exportar TODO a JSON</button>
            </div>
            <div class="leyenda">
                ${ETIQUETAS.map(e => `<span class="leyenda-item"><strong>${e.label}</strong>: ${e.nombres.join(', ')}</span>`).join(' | ')}
            </div>
        </div>
    `;

    // Crear grid de imágenes con checkboxes
    let imagenesHTML = '<div class="imagenes-grid">';

    imagenes.forEach((imagen, index) => {
        const imagenTags = etiquetasGuardadas[imagen] || [];

        imagenesHTML += `
            <div class="imagen-card" data-imagen="${imagen}">
                <img src="../ondas/imagenes/${encodeURIComponent(categoria)}/${encodeURIComponent(imagen)}"
                     alt="${imagen}"
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23ddd%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22%3ENo disponible%3C/text%3E%3C/svg%3E'">
                <div class="imagen-nombre">${imagen.replace(/^\d{4}[_:]\d{2}[_:]\d{2}_ONDAS\s*/, '').replace('.webp', '')}</div>
                <div class="checkboxes">
                    ${ETIQUETAS.map(etiqueta => `
                        <label class="checkbox-label">
                            <input type="checkbox"
                                   data-imagen="${imagen}"
                                   data-tag="${etiqueta.id}"
                                   ${imagenTags.includes(etiqueta.id) ? 'checked' : ''}
                                   onchange="actualizarTag('${categoria}', '${imagen}', '${etiqueta.id}', this.checked)">
                            ${etiqueta.label}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });

    imagenesHTML += '</div>';

    container.innerHTML = headerHTML + imagenesHTML;

    // Mostrar contador de etiquetadas
    actualizarContador(categoria);
}

// Actualizar una etiqueta
function actualizarTag(categoria, imagen, tagId, checked) {
    const etiquetas = cargarEtiquetasGuardadas(categoria);

    if (!etiquetas[imagen]) {
        etiquetas[imagen] = [];
    }

    if (checked) {
        if (!etiquetas[imagen].includes(tagId)) {
            etiquetas[imagen].push(tagId);
        }
    } else {
        etiquetas[imagen] = etiquetas[imagen].filter(t => t !== tagId);
        if (etiquetas[imagen].length === 0) {
            delete etiquetas[imagen];
        }
    }

    guardarEtiquetas(categoria, etiquetas);
    actualizarContador(categoria);
}

// Guardar todo (ya se guarda automáticamente, pero por si acaso)
function guardarTodo(categoria) {
    alert('¡Cambios guardados correctamente!');
}

// Actualizar contador de imágenes etiquetadas
function actualizarContador(categoria) {
    const etiquetas = cargarEtiquetasGuardadas(categoria);
    const total = Object.keys(etiquetas).length;

    let contadorEl = document.getElementById('contador');
    if (!contadorEl) {
        contadorEl = document.createElement('div');
        contadorEl.id = 'contador';
        contadorEl.className = 'contador';
        document.querySelector('.admin-header').appendChild(contadorEl);
    }
    contadorEl.textContent = `${total} imágenes etiquetadas en esta categoría`;
}

// Exportar todas las etiquetas de todas las categorías a JSON
function exportarJSON() {
    const categorias = [
        'COMPOSITORES',
        'CANTANTES',
        'OTROS INTÉRPRETES Y PROTAGONISTAS',
        'ÓPERAS',
        'OTRAS OBRAS MUSICALES CONCRETAS',
        'INSTRUMENTOS, INVENTOS, EXPERIMENTOS RADIOFÓNICOS',
        'CARICATURAS y RETRATOS de Compositores e intérpretes',
        'TIRAS CÓMICAS, CHISTES Y DIBUJOS',
        'PORTADAS MUSICALES (sin intérpretes o compositores concretos) y CABECERAS CON MÚSICA',
        'ANUNCIOS ',
        'ESTUDIOS DE RADIO Y OTRAS IMÁGENES GENERALES'
    ];

    const todasLasEtiquetas = {};

    categorias.forEach(cat => {
        const etiquetas = cargarEtiquetasGuardadas(cat);
        Object.entries(etiquetas).forEach(([imagen, tags]) => {
            todasLasEtiquetas[imagen] = tags;
        });
    });

    // Crear también un objeto por etiqueta (para búsqueda rápida)
    const porEtiqueta = {};
    ETIQUETAS.forEach(e => {
        porEtiqueta[e.id] = {
            sinonimos: e.nombres,
            imagenes: []
        };
    });

    Object.entries(todasLasEtiquetas).forEach(([imagen, tags]) => {
        tags.forEach(tagId => {
            if (porEtiqueta[tagId]) {
                porEtiqueta[tagId].imagenes.push(imagen);
            }
        });
    });

    const exportData = {
        porImagen: todasLasEtiquetas,
        porEtiqueta: porEtiqueta,
        metadatos: {
            fechaExportacion: new Date().toISOString(),
            totalImagenesEtiquetadas: Object.keys(todasLasEtiquetas).length,
            etiquetasDisponibles: ETIQUETAS.map(e => e.id)
        }
    };

    // Descargar archivo JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ondas_etiquetas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`¡Exportado! ${Object.keys(todasLasEtiquetas).length} imágenes etiquetadas en total.`);
}

// Filtrar solo imágenes con/sin etiquetas
function filtrarImagenes(mostrar) {
    const cards = document.querySelectorAll('.imagen-card');
    cards.forEach(card => {
        const checkboxes = card.querySelectorAll('input[type="checkbox"]');
        const tieneEtiquetas = Array.from(checkboxes).some(cb => cb.checked);

        if (mostrar === 'todas') {
            card.style.display = 'block';
        } else if (mostrar === 'etiquetadas' && tieneEtiquetas) {
            card.style.display = 'block';
        } else if (mostrar === 'sin-etiquetar' && !tieneEtiquetas) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
