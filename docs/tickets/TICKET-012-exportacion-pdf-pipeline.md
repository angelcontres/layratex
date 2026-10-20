# TICKET-012: Pipeline de Compilación, Visor y Exportación de PDF

- **Milestone:** Sprint 2 — Compilación a PDF y Exportación
- **Estado:** ⚪ Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UI & Pipeline

---

## 1. Descripción
Conectar el botón "Compilar PDF" (`Play` en header o atajo `Ctrl+B`) con el backend de compilación en Rust (**HU-23**, **HU-25**, **RF-38**, **RF-39**). Permitir previsualizar el PDF final o exportarlo a una ubicación elegida por el usuario con diálogo nativo.

## 2. Tareas Específicas
1. Conectar botón "Compilar PDF" y atajo de teclado `Ctrl+B` / `F5`.
2. Mostrar spinner e indicador de estado en la `StatusBar` ("Compilando LaTeX...").
3. Al finalizar con éxito:
   * Abrir diálogo de guardado para exportar el archivo `.pdf` o descargarlo.
   * Ofrecer la opción de abrir el PDF en el visor predeterminado del sistema operativo vía `open_path`.
4. Medir y mostrar el tiempo de compilación exacto en la barra de estado.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Hacer clic en "Compilar PDF" genera un archivo PDF idéntico al documento LaTeX editado.
* [ ] La interfaz permanece fluida y no se bloquea durante la compilación.
* [ ] El usuario puede elegir la carpeta y nombre donde guardar el PDF final.
