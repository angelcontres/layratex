# TICKET-020: Galería de Plantillas al Crear Documento

- **Milestone:** Sprint 5 — Plantillas, Navegación y Productividad
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media-Alta (P2)
- **Tipo:** Core Feature / Templates

---

## 1. Descripción
Permitir al usuario seleccionar entre diversas plantillas profesionales al presionar "Nuevo Documento" (<kbd>Ctrl+N</kbd>), en lugar de iniciar siempre con una plantilla genérica fija (**HU-01**, **RF-01**, **RF-42**).

## 2. Tareas Específicas
1. Diseñar el modal `TemplateGalleryModal.svelte` con tarjetas visuales, descripción y categoría.
2. Definir catálogo de plantillas iniciales probadas y listas para compilar:
   * **Artículo Científico (Estándar):** Documento limpio con título, autores, abstract, secciones, ecuación y bibliografía.
   * **Formato IEEE Transactions:** Plantilla de 2 columnas con metadatos formales.
   * **Presentación Beamer:** Diapositivas con tema moderno, marcos (`frame`), bloques y animaciones básicas.
   * **Reporte de Laboratorio / Proyecto de Ingeniería:** Con índice, objetivos, marco teórico, tabla de datos y conclusiones.
   * **Hoja de Ejercicios / Examen Matemático:** Con encabezado institucional y entorno de preguntas/problemas.
   * **Documento en Blanco:** Para usuarios avanzados que prefieren empezar desde cero.
3. Permitir guardar la plantilla favorita por defecto para nuevos documentos.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al presionar <kbd>Ctrl+N</kbd> o el botón "+" en la barra lateral, se despliega la galería de plantillas si el usuario así lo tiene configurado o mediante opción "Nuevo desde plantilla...".
* [ ] Al seleccionar una plantilla, se carga en el editor y el renderizado KaTeX se actualiza inmediatamente sin errores.
