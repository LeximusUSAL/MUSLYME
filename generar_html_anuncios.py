#!/usr/bin/env python3
"""Script para generar el HTML de anuncios con todas las imágenes"""

import os
import re
import sys

# Obtener lista de imágenes
imagenes_dir = "ondas/imagenes/ANUNCIOS "
imagenes = []

for filename in sorted(os.listdir(imagenes_dir)):
    if filename.endswith('.png'):
        # Parsear el nombre del archivo: YYYY:MM:DD_ONDAS[número opcional] Título.png
        match = re.match(r'(\d{4}):(\d{2}):(\d{2})_ONDAS\d*\s+(.+)\.png', filename)
        if match:
            year, month, day, title = match.groups()
            fecha_display = f"{day}/{month}/{year}"
            imagenes.append({
                'filename': filename,
                'fecha': fecha_display,
                'titulo': title.strip()
            })
        else:
            print(f"No se pudo parsear: {filename}", file=sys.stderr)

# Generar el código HTML para las imágenes
html_items = []
for img in imagenes:
    html_item = f'''            <div class="gallery-item">
                <img src="ondas/imagenes/ANUNCIOS /{img['filename']}" alt="{img['titulo']}" loading="lazy">
                <div class="image-caption">
                    <div class="image-date">{img['fecha']}</div>
                    <div class="image-title">{img['titulo']}</div>
                </div>
            </div>'''
    html_items.append(html_item)

# Generar el array de JavaScript
js_array = ',\n            '.join([f"'{img['filename']}'" for img in imagenes])

print(f"Total de imágenes: {len(imagenes)}")
print("\n<!-- Código HTML para las imágenes -->")
print('\n\n'.join(html_items))
print(f"\n\n<!-- Array JavaScript -->")
print(f"const adImages = [\n            {js_array}\n        ];")
