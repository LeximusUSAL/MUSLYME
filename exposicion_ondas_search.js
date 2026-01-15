/**
 * ONDAS Virtual Exhibition - Search and Metadata Handler
 * Sistema de búsqueda universal para categorías, imágenes, fechas, autores, compositores e intérpretes
 */

// Base de datos de todas las imágenes de la exposición (se carga dinámicamente desde JSON)
let ondasDatabase = {
    compositores: [],
    cantantes: [],
    interpretes: [],
    operas: [],
    zarzuelas: [],
    instrumentos: [],
    caricaturas_retratos: [],
    caricaturas: [],
    portadas: [],
    anuncios: [],
    otras: []
};

// Base de datos de etiquetas de equipos de audio
let equiposAudioData = null;

// Sinónimos para búsqueda de equipos de audio
const equiposSinonimos = {
    microfono: ['micrófono', 'microfono', 'mic', 'microfonos', 'micrófonos'],
    altavoz: ['altavoz', 'altavoces', 'speaker', 'speakers', 'bocina', 'bocinas'],
    cascos: ['cascos', 'auriculares', 'headphones', 'audífonos', 'audifonos', 'auricular']
};

// Estado de carga de la base de datos
let isDatabaseLoaded = false;

// Mapeo de categorías a URLs
const categoryURLs = {
    compositores: 'exposicion_ondas_compositores.html',
    cantantes: 'exposicion_ondas_cantantes.html',
    interpretes: 'exposicion_ondas_interpretes.html',
    operas: 'exposicion_ondas_operas.html',
    zarzuelas: 'exposicion_ondas_zarzuelas.html',
    instrumentos: 'exposicion_ondas_instrumentos.html',
    caricaturas_retratos: 'exposicion_ondas_caricaturas_retratos.html',
    caricaturas: 'exposicion_ondas_caricaturas.html',
    portadas: 'exposicion_ondas_portadas.html',
    anuncios: 'exposicion_ondas_anuncios.html',
    otras: 'exposicion_ondas_otras.html'
};

// Nombres completos de categorías
const categoryNames = {
    compositores: 'Compositores',
    cantantes: 'Cantantes',
    interpretes: 'Otros Intérpretes y Protagonistas',
    operas: 'Óperas',
    zarzuelas: 'Otras Obras Musicales Concretas',
    instrumentos: 'Instrumentos, Inventos y Experimentos Radiofónicos',
    caricaturas_retratos: 'Caricaturas y Retratos de Compositores e Intérpretes',
    caricaturas: 'Tiras Cómicas, Chistes y Dibujos',
    portadas: 'Portadas Musicales y Cabeceras',
    anuncios: 'Anuncios',
    otras: 'Estudios de Radio y Otras Imágenes Generales'
};

/**
 * Extrae metadatos del nombre del archivo de imagen
 * Formato: YYYY:MM:DD_ONDAS Nombre.png o YYYY_MM_DD_ONDAS Nombre.png
 */
function extractMetadata(filename) {
    // Remover la extensión .webp o .png
    const nameWithoutExt = filename.replace('.webp', '').replace('.png', '');

    // Buscar patrón de fecha (YYYY:MM:DD o YYYY_MM_DD)
    // Acepta tanto espacio como guión bajo antes de ONDAS
    const datePattern1 = /^(\d{4}):(\d{2}):(\d{2})[_\s]+ONDAS\s+(.+)$/;
    const datePattern2 = /^(\d{4})_(\d{2})_(\d{2})[_\s]+ONDAS\s+(.+)$/;

    let match = nameWithoutExt.match(datePattern1) || nameWithoutExt.match(datePattern2);

    if (match) {
        const [_, year, month, day, title] = match;
        return {
            date: `${day}/${month}/${year}`,
            year: year,
            month: month,
            day: day,
            title: title.trim(),
            rawFilename: filename
        };
    }

    // Si no coincide el patrón, devolver información básica
    return {
        date: 'Fecha no disponible',
        year: '',
        month: '',
        day: '',
        title: nameWithoutExt.replace(/_ONDAS\s+/, ''),
        rawFilename: filename
    };
}

/**
 * Normaliza texto para búsqueda (elimina acentos y convierte a minúsculas)
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta si el término de búsqueda corresponde a un equipo de audio
 */
function detectEquipoAudio(searchTerm) {
    const normalized = normalizeText(searchTerm);
    for (const [equipo, sinonimos] of Object.entries(equiposSinonimos)) {
        for (const sinonimo of sinonimos) {
            if (normalizeText(sinonimo).includes(normalized) || normalized.includes(normalizeText(sinonimo))) {
                return equipo;
            }
        }
    }
    return null;
}

/**
 * Realiza búsqueda en todas las categorías
 */
function performSearch(searchTerm) {
    if (!isDatabaseLoaded) {
        alert('La base de datos aún se está cargando. Por favor, espere un momento e intente de nuevo.');
        return [];
    }

    const normalizedSearch = normalizeText(searchTerm);
    const results = [];
    const addedImages = new Set(); // Para evitar duplicados

    // Primero, buscar en equipos de audio si el término coincide
    const equipoDetectado = detectEquipoAudio(searchTerm);
    if (equipoDetectado && equiposAudioData && equiposAudioData.imagenes) {
        const equipoNombres = {
            microfono: 'Micrófono',
            altavoz: 'Altavoz',
            cascos: 'Cascos/Auriculares'
        };

        // Mapeo de carpetas a categorías del sistema
        const carpetaToCategory = {
            'ANUNCIOS ': 'anuncios',
            'CANTANTES': 'cantantes',
            'CARICATURAS y RETRATOS de Compositores e intérpretes': 'caricaturas_retratos',
            'COMPOSITORES': 'compositores',
            'ESTUDIOS DE RADIO Y OTRAS IMÁGENES GENERALES': 'otras',
            'INSTRUMENTOS, INVENTOS, EXPERIMENTOS RADIOFÓNICOS': 'instrumentos',
            'ÓPERAS': 'operas',
            'OTRAS OBRAS MUSICALES CONCRETAS': 'zarzuelas',
            'OTROS INTÉRPRETES Y PROTAGONISTAS': 'interpretes',
            'PORTADAS MUSICALES (sin intérpretes o compositores concretos) y CABECERAS CON MÚSICA': 'portadas',
            'TIRAS CÓMICAS, CHISTES Y DIBUJOS': 'caricaturas'
        };

        equiposAudioData.imagenes.forEach(img => {
            if (img.categorias.includes(equipoDetectado)) {
                const category = carpetaToCategory[img.carpeta] || 'otras';
                const imageKey = img.archivo;

                if (!addedImages.has(imageKey)) {
                    addedImages.add(imageKey);
                    const metadata = extractMetadata(img.archivo);

                    results.push({
                        type: 'image',
                        category: category,
                        categoryName: categoryNames[category],
                        url: categoryURLs[category],
                        image: img.archivo,
                        metadata: metadata,
                        relevance: 90,
                        matchedFields: [`equipo: ${equipoNombres[equipoDetectado]}`],
                        equipoAudio: img.categorias
                    });
                }
            }
        });
    }

    // Buscar en cada categoría
    for (const [category, images] of Object.entries(ondasDatabase)) {
        // Buscar coincidencia en el nombre de la categoría
        if (normalizeText(categoryNames[category]).includes(normalizedSearch)) {
            results.push({
                type: 'category',
                category: category,
                categoryName: categoryNames[category],
                url: categoryURLs[category],
                relevance: 100
            });
        }

        // Buscar en cada imagen de la categoría
        images.forEach((image, index) => {
            if (addedImages.has(image)) return; // Evitar duplicados

            const metadata = extractMetadata(image);
            let relevance = 0;
            let matchedFields = [];

            // Buscar en título
            if (normalizeText(metadata.title).includes(normalizedSearch)) {
                relevance += 50;
                matchedFields.push('título');
            }

            // Buscar en fecha
            if (metadata.date.includes(searchTerm) ||
                metadata.year === searchTerm ||
                metadata.month === searchTerm ||
                metadata.day === searchTerm) {
                relevance += 30;
                matchedFields.push('fecha');
            }

            // Buscar en categoría
            if (normalizeText(category).includes(normalizedSearch)) {
                relevance += 20;
                matchedFields.push('categoría');
            }

            if (relevance > 0) {
                results.push({
                    type: 'image',
                    category: category,
                    categoryName: categoryNames[category],
                    url: categoryURLs[category],
                    image: image,
                    metadata: metadata,
                    relevance: relevance,
                    matchedFields: matchedFields
                });
            }
        });
    }

    // Ordenar por relevancia
    results.sort((a, b) => b.relevance - a.relevance);

    return results;
}

/**
 * Muestra todos los resultados de búsqueda en una sola página
 */
function displaySearchResults(results) {
    const container = document.querySelector('.container');

    // Eliminar resultados anteriores si existen
    const existingResults = document.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }

    // Crear sección de resultados
    const resultsSection = document.createElement('section');
    resultsSection.className = 'search-results';

    if (results.length === 0) {
        resultsSection.innerHTML = `
            <h3>Resultados de la Búsqueda</h3>
            <div class="ornamental-line"></div>
            <p class="no-results">No se encontraron resultados para su búsqueda.</p>
        `;
    } else {
        let resultsHTML = `
            <h3>Resultados de la Búsqueda (${results.length} resultados)</h3>
            <div class="ornamental-line"></div>
            <div class="gallery-grid">
        `;

        // Mapeo de nombres de categoría a nombres de directorio
        const categoryDirMap = {
            'Compositores': 'COMPOSITORES',
            'Cantantes': 'CANTANTES',
            'Otros Intérpretes y Protagonistas': 'OTROS INTÉRPRETES Y PROTAGONISTAS',
            'Óperas': 'ÓPERAS',
            'Otras Obras Musicales Concretas': 'OTRAS OBRAS MUSICALES CONCRETAS',
            'Instrumentos, Inventos y Experimentos Radiofónicos': 'INSTRUMENTOS, INVENTOS, EXPERIMENTOS RADIOFÓNICOS',
            'Caricaturas y Retratos de Compositores e Intérpretes': 'CARICATURAS y RETRATOS de Compositores e intérpretes',
            'Tiras Cómicas, Chistes y Dibujos': 'TIRAS CÓMICAS, CHISTES Y DIBUJOS',
            'Portadas Musicales y Cabeceras': 'PORTADAS MUSICALES (sin intérpretes o compositores concretos) y CABECERAS CON MÚSICA',
            'Anuncios': 'ANUNCIOS ',
            'Estudios de Radio y Otras Imágenes Generales': 'ESTUDIOS DE RADIO Y OTRAS IMÁGENES GENERALES'
        };

        results.forEach(result => {
            if (result.type === 'category') {
                resultsHTML += `
                    <a href="${result.url}" class="category-card">
                        <h3>${result.categoryName}</h3>
                        <p class="category-desc">Ver toda la categoría</p>
                    </a>
                `;
            } else if (result.type === 'image') {
                const categoryDir = categoryDirMap[result.categoryName] || result.categoryName.toUpperCase();
                // Reemplazar .png por .webp ya que los archivos reales están en formato WebP
                const imageWithWebp = result.image.replace('.png', '.webp');
                // Normalizar a NFC (forma compuesta) para coincidir con GitHub Pages
                const categoryDirNFC = categoryDir.normalize('NFC');
                const imageNFC = imageWithWebp.normalize('NFC');
                // Encodear para manejar caracteres especiales y espacios
                const categoryDirEncoded = encodeURIComponent(categoryDirNFC);
                const imageEncoded = encodeURIComponent(imageNFC);
                const imagePath = `ondas/imagenes/${categoryDirEncoded}/${imageEncoded}`;

                // Generar etiquetas de equipos de audio si existen
                let equipoTagsHTML = '';
                if (result.equipoAudio && result.equipoAudio.length > 0) {
                    const equipoIcons = { microfono: '🎤', altavoz: '🔊', cascos: '🎧' };
                    const equipoColors = { microfono: '#e74c3c', altavoz: '#3498db', cascos: '#2ecc71' };
                    const equipoNames = { microfono: 'Micrófono', altavoz: 'Altavoz', cascos: 'Cascos' };
                    equipoTagsHTML = '<div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">';
                    result.equipoAudio.forEach(eq => {
                        equipoTagsHTML += `<span style="background: ${equipoColors[eq]}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem;">${equipoIcons[eq]} ${equipoNames[eq]}</span>`;
                    });
                    equipoTagsHTML += '</div>';
                }

                resultsHTML += `
                    <div class="gallery-item" style="position: relative;">
                        ${equipoTagsHTML}
                        <img src="${imagePath}"
                             alt="${result.metadata.title}"
                             loading="lazy"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23f0f0f0\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-family=\'Arial\' font-size=\'14\'%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
                        <div class="image-caption">
                            <div class="image-date">${result.metadata.date}</div>
                            <div class="image-title">${result.metadata.title}</div>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                                ${result.categoryName}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        resultsHTML += '</div>';
        resultsSection.innerHTML = resultsHTML;
    }

    // Insertar resultados después de la navegación
    const nav = document.querySelector('.main-nav');
    nav.insertAdjacentElement('afterend', resultsSection);

    // Scroll suave a los resultados
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Inicializa la funcionalidad de búsqueda
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearch');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length > 0) {
                const results = performSearch(searchTerm);
                displaySearchResults(results);
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            const existingResults = document.querySelector('.search-results');
            if (existingResults) {
                existingResults.remove();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
}

/**
 * Carga las imágenes de una categoría específica (para páginas de galería)
 */
function loadCategoryImages(category, images) {
    ondasDatabase[category] = images;
}

/**
 * Carga la base de datos de imágenes desde el archivo JSON
 */
async function loadDatabase() {
    try {
        // Cargar base de datos principal
        const response = await fetch('ondas_database.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        ondasDatabase = data;
        isDatabaseLoaded = true;
        console.log('✓ Base de datos ONDAS cargada:', {
            total: Object.values(ondasDatabase).reduce((sum, arr) => sum + arr.length, 0),
            categorias: Object.keys(ondasDatabase).length
        });

        // Cargar base de datos de equipos de audio
        try {
            const equiposResponse = await fetch('ondas_etiquetas_equipos_audio.json');
            if (equiposResponse.ok) {
                equiposAudioData = await equiposResponse.json();
                console.log('✓ Etiquetas de equipos de audio cargadas:', {
                    total: equiposAudioData.imagenes ? equiposAudioData.imagenes.length : 0
                });
            }
        } catch (equiposError) {
            console.warn('Aviso: No se pudieron cargar las etiquetas de equipos de audio:', equiposError);
        }
    } catch (error) {
        console.error('Error cargando base de datos ONDAS:', error);
        alert('Error: No se pudo cargar la base de datos de imágenes. El buscador no funcionará correctamente.');
    }
}

/**
 * Inicializa el sistema cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    initializeSearch();
    console.log('ONDAS Virtual Exhibition - Sistema de búsqueda inicializado');
});

// Exportar funciones para uso en páginas de galería
window.ondasExhibition = {
    extractMetadata,
    loadCategoryImages,
    performSearch,
    displaySearchResults
};
