# TICKET-003: Maquetación del Shell de la Aplicación (UI Base)

- **Milestone:** Sprint 0 — Scaffolding y Entorno Base
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media
- **Tipo:** UI / Layout

---

## 1. Descripción
Diseñar e implementar el cascarón (Shell) visual de la aplicación: una interfaz limpia, minimalista y oscura (Dark mode optimizado), diseñada para que la mayor cantidad de pantalla se destine a la redacción y vista previa del documento.

## 2. Componentes del Shell
1. **Activity Bar / Sidebar Lateral Colapsable:**
   * Explorador de archivos del proyecto (`.tex`, imágenes, bibliografía).
   * Panel de Conectividad P2P (Dispositivos emparejados, estado en vivo).
   * Configuración y diagnósticos.
2. **Área Principal de Trabajo (Split View flexible):**
   * Panel Izquierdo: Editor de Código / Bloques Visuales.
   * Divisor arrastrable (Resizer) para ajustar proporciones.
   * Panel Derecho: Previsualizador reactivo / Visor PDF.
3. **Barra de Estado Inferior:**
   * Nombre de archivo activo.
   * Conteo de palabras y líneas.
   * Indicador de estado de sincronización P2P (ej. `● Sincronizado (2 pares)` / `○ Modo Offline`).
   * Tiempo de renderizado del último frame de preview.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] La interfaz se adapta dinámicamente al tamaño de ventana del usuario sin desbordamientos ni scrollbags no deseados.
* [ ] El divisor central se puede arrastrar suavemente a 60 FPS sin lag.
* [ ] La barra de estado muestra indicadores reactivos reales.
