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
    caricaturas: [],
    portadas: [],
    anuncios: [],
    otras: []
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
    caricaturas: 'exposicion_ondas_caricaturas.html',
    portadas: 'exposicion_ondas_portadas.html',
    anuncios: 'exposicion_ondas_anuncios.html',
    otras: 'exposicion_ondas_otras.html'
};

// Nombres completos de categorías
const categoryNames = {
    compositores: 'Compositores',
    cantantes: 'Cantantes',
    interpretes: 'Otros Intérpretes',
    operas: 'Óperas',
    zarzuelas: 'Zarzuela y Obras Musicales',
    instrumentos: 'Instrumentos e Inventos',
    caricaturas: 'Caricaturas y Dibujos',
    portadas: 'Portadas Musicales',
    anuncios: 'Anuncios',
    otras: 'Otras Imágenes'
};

/**
 * Extrae metadatos del nombre del archivo de imagen
 * Formato: YYYY:MM:DD_ONDAS Nombre.png o YYYY_MM_DD_ONDAS Nombre.png
 */
function extractMetadata(filename) {
    // Remover la extensión .png
    const nameWithoutExt = filename.replace('.png', '');

    // Buscar patrón de fecha (YYYY:MM:DD o YYYY_MM_DD)
    const datePattern1 = /^(\d{4}):(\d{2}):(\d{2})_ONDAS\s+(.+)$/;
    const datePattern2 = /^(\d{4})_(\d{2})_(\d{2})_ONDAS\s+(.+)$/;

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
 * Realiza búsqueda en todas las categorías
 */
function performSearch(searchTerm) {
    if (!isDatabaseLoaded) {
        alert('La base de datos aún se está cargando. Por favor, espere un momento e intente de nuevo.');
        return [];
    }

    const normalizedSearch = normalizeText(searchTerm);
    const results = [];

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
 * Muestra los resultados de búsqueda
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
            <h3>Resultados de la Búsqueda (${results.length})</h3>
            <div class="ornamental-line"></div>
            <div class="gallery-grid">
        `;

        results.slice(0, 50).forEach(result => {
            if (result.type === 'category') {
                resultsHTML += `
                    <a href="${result.url}" class="category-card">
                        <h3>${result.categoryName}</h3>
                        <p class="category-desc">Ver toda la categoría</p>
                    </a>
                `;
            } else if (result.type === 'image') {
                // Mapeo de nombres de categoría a nombres de directorio
                const categoryDirMap = {
                    'Compositores': 'COMPOSITORES',
                    'Cantantes': 'CANTANTES',
                    'Otros Intérpretes': 'OTROS INTÉRPRETES',
                    'Óperas': 'ÓPERAS',
                    'Zarzuela y Obras Musicales': 'ZARZUELA Y OBRAS MUSICALES CONCRETAS',
                    'Instrumentos e Inventos': 'INSTRUMENTOS e INVENTOS',
                    'Caricaturas y Dibujos': 'CARICATURAS, TIRAS CÓMICAS, DIBUJOS',
                    'Portadas Musicales': 'PORTADAS y CABECERAS MUSICALES',
                    'Anuncios': 'ANUNCIOS ',
                    'Otras Imágenes': 'OTRAS IMÁGENES y PORTADAS GENERALISTAS'
                };

                const categoryDir = categoryDirMap[result.categoryName] || result.categoryName.toUpperCase();
                const imagePath = `ondas/imagenes/${categoryDir}/${result.image}`;

                resultsHTML += `
                    <div class="gallery-item">
                        <img src="${imagePath}"
                             alt="${result.metadata.title}"
                             loading="lazy"
                             onerror="this.style.display='none'; this.parentElement.style.display='none';">
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

        if (results.length > 50) {
            resultsHTML += `<p style="text-align: center; margin-top: 2rem; font-style: italic; color: #666;">
                Mostrando los primeros 50 resultados de ${results.length} encontrados.
            </p>`;
        }

        resultsSection.innerHTML = resultsHTML;
    }

    // Insertar resultados después de la navegación
    const nav = document.querySelector('.main-nav');
    nav.insertAdjacentElement('afterend', resultsSection);

    // Scroll a los resultados
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
