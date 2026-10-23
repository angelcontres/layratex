# TICKET-013: Captura y Parseo de Errores del Compilador LaTeX

- **Milestone:** Sprint 2 — Compilación a PDF y Exportación
- **Estado:** 🟢 Cerrado
- **Prioridad:** Media-Alta (P2)
- **Tipo:** Core Feature / Error Handling

---

## 1. Descripción
Parsear el log estándar de LaTeX cuando ocurre una falla de compilación (**HU-24**, **RF-40**). Presentar los errores y advertencias en un panel inferior colapsable con número de línea y mensaje entendible, permitiendo al usuario saltar directamente a la línea afectada en el editor.

## 2. Tareas Específicas
1. Implementar parser de logs de LaTeX (expresiones regulares para patrones como `! Undefined control sequence. l.15 ...`).
2. Diseñar un componente colapsable `ErrorPanel.svelte` en la parte inferior de la pantalla.
3. Clasificar los eventos en: Errores críticos (rojo), Advertencias (amarillo) y Bad Boxes (gris).
4. Al hacer clic en un error de la lista, posicionar el cursor de CodeMirror en la línea especificada y hacer scroll suave.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Si un documento tiene sintaxis inválida, la compilación no falla silenciosamente; despliega el panel de errores.
* [x] Hacer clic sobre el error en el panel desplaza el cursor de CodeMirror exactamente a la línea del error.
