# Product Backlog — Editor de documentación técnica LaTeX multiplataforma

> **Última actualización:** 2026-08-14  
> **Propietario del producto:** Equipo de 1 persona  
> **Metodología:** Scrum adaptado para 1 persona | Sprints: 1 semana  
> **Objetivo:** MVP funcional en 2 sprints (app usable: crear → editar → compilar → preview → exportar PDF)

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Glosario](#2-glosario)
3. [Épicas](#3-épicas)
4. [Product Backlog Priorizado](#4-product-backlog-priorizado)
5. [MVP Definido](#5-mvp-definido)
6. [Sprint Planning Sugerido](#6-sprint-planning-sugerido)
7. [DoR y DoD](#7-dor-y-dod)
8. [Riesgos y Supuestos](#8-riesgos-y-supuestos)

---

## 1. Resumen Ejecutivo

Este proyecto es una aplicación de escritorio multiplataforma (Windows, Linux, macOS) para la creación y edición de documentación técnica basada en LaTeX. El diferencial clave es un editor híbrido que permite alternar entre edición directa de código LaTeX, componentes visuales (WYSIWYG), y un modo mixto donde ambas representaciones se sincronizan en tiempo real.

La estrategia de entrega se enfoca en un **MVP ultra-delgado**: en solo 2 sprints (2 semanas) se debe poder crear un documento, editar código LaTeX, compilarlo, observar una vista previa actualizada automáticamente y exportar a PDF. Todo lo demás —modo visual, tablas, ecuaciones, integración GitHub— se construye sobre esa base estable.

El equipo es de **1 persona**, por lo que el backlog está recortado para evitar agotamiento. No se incluye colaboración en tiempo real (RF-53) dentro del plan; queda en el backlog como evolución futura.

---

## 2. Glosario

| Término | Definición |
|---|---|
| **LaTeX** | Sistema de composición de textos orientado a la creación de documentos con alta calidad tipográfica. |
| **Modo Código** | Interfaz de edición donde el usuario manipula el código fuente LaTeX directamente. |
| **Modo Visual** | Interfaz de edición con componentes arrastrables/seleccionables que generan código LaTeX automáticamente. |
| **Modo Híbrido** | Vista dividida donde el código LaTeX y la representación visual se muestran simultáneamente y se sincronizan. |
| **Vista Previa** | Renderizado visual del documento que se actualiza conforme el usuario edita. |
| **Compilación** | Proceso de transformar código LaTeX en un documento procesado (generalmente DVI o PDF). |
| **MVP** | Producto Mínimo Viable. La menor cantidad de funcionalidad que permite usar la app de forma útil. |
| **Story Points (SP)** | Unidad de estimación relativa de esfuerzo. 1 SP ≈ 1–2 horas de trabajo productivo. |
| **DoR** | Definition of Ready. Condiciones para que una historia entre a un sprint. |
| **DoD** | Definition of Done. Condiciones para dar una historia por terminada. |
| **Épica** | Conjunto de historias relacionadas que entregan un bloque de valor coherente al usuario. |

---

## 3. Épicas

---

### E0 — Configuración del Entorno

**Objetivo de negocio:** Garantizar que la aplicación puede compilar documentos LaTeX sin configuración manual compleja por parte del usuario.

**RF que agrupa:** *(Nuevo — derivado de necesidad técnica implícita en RF-36)*

#### HU-00: Configurar motor LaTeX
> Como usuario, quiero que la aplicación detecte o me guíe a instalar un compilador LaTeX, para poder compilar documentos sin configurar nada manualmente.

- **Prioridad:** P1 🟢
- **Story Points:** 5
- **Sprint sugerido:** Sprint 0
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** que abro la app por primera vez, **when** no detecta un compilador LaTeX instalado, **then** la app muestra un diálogo con instrucciones o instala automáticamente el motor necesario.
2. **Given** que tengo TeX Live / MiKTeX instalado, **when** abro la app, **then** la detecta automáticamente sin pedir configuración.
3. **Given** que el motor está configurado, **when** creo un documento mínimo (`\documentclass{article} \begin{document} Hola \end{document}`), **then** la compilación produce salida sin errores.

---

### E1 — Gestión de Documentos

**Objetivo de negocio:** Permitir al usuario persistir y recuperar su trabajo en archivos `.tex` estándar.

**RF que agrupa:** RF-01, RF-31, RF-32, RF-33, RF-34, RF-35

#### HU-01: Crear documento nuevo
> Como usuario, quiero crear un documento nuevo, para empezar a elaborar documentación desde cero.

- **Prioridad:** P1 🟢
- **Story Points:** 1
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** que estoy en la pantalla inicial, **when** selecciono "Crear documento", **then** el sistema genera un documento nuevo con el editor listo.
2. **Given** un documento recién creado, **when** reviso el editor, **then** el documento está disponible para escribir contenido.
3. **Given** un documento sin guardar, **when** no lo he guardado aún, **then** el sistema lo identifica visualmente como "Sin título".

#### HU-02: Abrir documento LaTeX
> Como usuario, quiero abrir un documento LaTeX existente, para continuar su edición desde donde lo dejé.

- **Prioridad:** P1 🟢
- **Story Points:** 2
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** que ejecuto "Abrir", **when** selecciono un archivo `.tex` en el selector, **then** su contenido se carga en el editor.
2. **Given** que abro el selector de archivos, **when** cancelo sin seleccionar, **then** el editor permanece sin cambios.
3. **Given** que selecciono un archivo no compatible o corrupto, **when** intento abrirlo, **then** el sistema muestra un mensaje de error claro y no altera el documento actual.

#### HU-03: Guardar documento en formato .tex
> Como usuario, quiero guardar el documento como archivo LaTeX en una ubicación de mi elección, para conservar los cambios.

- **Prioridad:** P1 🟢
- **Story Points:** 2
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento con cambios, **when** ejecuto guardar (`Ctrl+S`), **then** se genera o actualiza un archivo con extensión `.tex`.
2. **Given** un documento nuevo, **when** lo guardo por primera vez, **then** puedo elegir la ubicación y el nombre mediante diálogo nativo.
3. **Given** un documento ya guardado previamente, **when** guardo de nuevo, **then** el archivo se sobrescribe con los últimos cambios sin pedir ubicación.

---

### E2 — Editor de Código LaTeX

**Objetivo de negocio:** Brindar control total sobre el código fuente LaTeX con una experiencia de editor moderna.

**RF que agrupa:** RF-02, RF-03, RF-04, RF-27, RF-28, RF-29, RF-30, RF-41

#### HU-04: Escribir y modificar código LaTeX
> Como usuario, quiero escribir y modificar código LaTeX directamente en el editor, para tener control total sobre el contenido del documento.

- **Prioridad:** P1 🟢
- **Story Points:** 5
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento abierto, **when** escribo código LaTeX, **then** el contenido aparece en el editor con sintaxis resaltada.
2. **Given** contenido en el editor, **when** modifico una parte del código, **then** la modificación se conserva en memoria y en disco al guardar.
3. **Given** el editor de código, **when** inserto código de un elemento LaTeX (sección, imagen, tabla, etc.), **then** el elemento queda incorporado al documento fuente.
4. **Given** que el sistema genera o modifica elementos, **when** reviso el código fuente, **then** este usa sintaxis LaTeX estándar y compatible.

#### HU-05: Copiar y pegar contenido
> Como usuario, quiero copiar y pegar contenido del documento, para reutilizarlo en otra ubicación.

- **Prioridad:** P2 🟡
- **Story Points:** 3
- **Sprint sugerido:** Sprint 3
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** selecciono contenido, **then** la selección se identifica visualmente.
2. **Given** contenido seleccionado, **when** presiono `Ctrl+C`, **then** el contenido queda en el portapapeles del sistema.
3. **Given** contenido en el portapapeles, **when** posiciono el cursor y presiono `Ctrl+V`, **then** el contenido se inserta en esa ubicación respetando formato.

#### HU-06: Menú contextual
> Como usuario, quiero un menú contextual al hacer clic derecho, para acceder a acciones relacionadas con el contenido.

- **Prioridad:** P4 🔴
- **Story Points:** 3
- **Sprint sugerido:** Sprint 7
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** el área de edición, **when** hago clic derecho, **then** se muestra el menú contextual.
2. **Given** el menú contextual mostrado, **when** reviso sus opciones, **then** ofrece acciones relacionadas con el contenido bajo el cursor (copiar, pegar, eliminar).
3. **Given** el menú abierto, **when** hago clic fuera o pulso `Escape`, **then** el menú se cierra sin ejecutar acciones.

---

### E3 — Editor Visual y Modo Híbrido

**Objetivo de negocio:** Permitir a usuarios no expertos en LaTeX crear documentos sin escribir código, manteniendo la capacidad de editar código cuando se necesite.

**RF que agrupa:** RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RF-11, RF-12, RF-41

#### HU-07: Cambiar modo de edición
> Como usuario, quiero cambiar entre los modos de edición (código, visual e híbrido), para usar la forma que prefiera según el momento.

- **Prioridad:** P2 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 3
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento en modo código, **when** selecciono modo visual, **then** el sistema muestra la interfaz visual del documento.
2. **Given** cualquier modo, **when** selecciono modo híbrido, **then** el sistema muestra el código y los componentes visuales simultáneamente en paneles divididos.
3. **Given** un documento con contenido, **when** cambio de modo, **then** el contenido y los cambios no guardados se conservan.

#### HU-08: Panel de componentes visuales
> Como usuario, quiero consultar el panel de componentes visuales, para elegir el elemento que deseo insertar.

- **Prioridad:** P2 🟡
- **Story Points:** 3
- **Sprint sugerido:** Sprint 4
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** el modo visual o híbrido activo, **when** accedo al panel de componentes, **then** se muestran los componentes disponibles (texto, sección, imagen, tabla, ecuación, etc.).
2. **Given** el panel abierto, **when** selecciono un componente, **then** el sistema identifica visualmente el componente seleccionado.
3. **Given** el panel de componentes, **when** cambio de modo a código puro, **then** el panel se oculta o desactiva gracefully.

#### HU-09: Insertar componente visual (texto y secciones)
> Como usuario, quiero insertar un componente visual básico (texto o sección) en el documento, para incorporar elementos sin escribir código.

- **Prioridad:** P2 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 4
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un componente de texto/sección seleccionado en el panel, **when** lo inserto en el documento visual, **then** el elemento aparece en la posición del cursor.
2. **Given** un componente insertado visualmente, **when** reviso el código fuente, **then** el sistema genera el código LaTeX correspondiente al elemento.
3. **Given** el código LaTeX generado, **when** valido su sintaxis, **then** es compatible con LaTeX estándar y compilable.

#### HU-10: Insertar componentes visuales avanzados
> Como usuario, quiero insertar componentes visuales complejos (tablas, imágenes, ecuaciones), para enriquecer el documento sin conocer LaTeX.

- **Prioridad:** P2 🟡
- **Story Points:** 8
- **Sprint sugerido:** Sprint 5
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** el modo visual, **when** selecciono "Tabla" y defino filas/columnas, **then** se inserta una tabla editable con código LaTeX `tabular` generado.
2. **Given** el modo visual, **when** selecciono "Imagen" y elijo un archivo, **then** se inserta con el entorno `figure` y ruta relativa correcta.
3. **Given** el modo visual, **when** selecciono "Ecuación", **then** se inserta un entorno `equation` listo para editar.
4. **Given** cualquier componente insertado, **when** reviso el modo código, **then** el LaTeX generado es válido y estándar.

#### HU-11: Sincronización bidireccional código ↔ visual
> Como usuario, quiero que los cambios en el código se reflejen en la vista visual y viceversa, para trabajar con ambos mecanismos sin perder consistencia.

- **Prioridad:** P2 🟡
- **Story Points:** 13
- **Sprint sugerido:** Sprint 6
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** el modo híbrido, **when** modifico el código LaTeX manualmente, **then** la vista visual se actualiza para reflejar el cambio en ≤ 1 segundo.
2. **Given** el modo híbrido, **when** modifico un elemento visualmente (ej: cambio texto de una tabla), **then** el código fuente se actualiza automáticamente.
3. **Given** un documento editado por ambos métodos, **when** guardo, **then** ambos tipos de cambios se conservan coherentemente en el archivo `.tex`.
4. **Given** un código LaTeX con errores de sintaxis, **when** intento sincronizar a visual, **then** el sistema muestra el último estado válido conocido y marca la inconsistencia.

---

### E4 — Elementos del Documento

**Objetivo de negocio:** Proveer todos los elementos estructurales necesarios para documentación técnica completa.

**RF que agrupa:** RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52

#### HU-12: Insertar y editar texto
> Como usuario, quiero insertar y editar texto, para incorporar contenido textual al documento.

- **Prioridad:** P1 🟢
- **Story Points:** 2
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento, **when** escribo texto plano, **then** el contenido aparece correctamente en el documento y en el código fuente.
2. **Given** texto existente, **when** lo modifico, **then** el contenido actualizado permanece en el documento tras guardar.

#### HU-13: Insertar y modificar secciones
> Como usuario, quiero insertar y modificar secciones y subsecciones, para organizar la estructura del documento.

- **Prioridad:** P1 🟢
- **Story Points:** 2
- **Sprint sugerido:** Sprint 1
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto `\section{}` y `\subsection{}`, **then** ambas aparecen correctamente jerarquizadas en el código y en la preview.
2. **Given** el título de una sección, **when** lo modifico, **then** el cambio se refleja en la estructura del documento y en el índice si existe.

#### HU-14: Insertar y ajustar imágenes
> Como usuario, quiero insertar y ajustar imágenes, para incorporar contenido gráfico compatible con LaTeX.

- **Prioridad:** P1 🟢
- **Story Points:** 5
- **Sprint sugerido:** Sprint 2
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto una imagen mediante `\includegraphics`, **then** aparece correctamente en la vista previa.
2. **Given** una imagen insertada, **when** modifico propiedades disponibles (ancho, alto, posición, caption), **then** el cambio se refleja en el documento compilado.

#### HU-15: Insertar y modificar tablas
> Como usuario, quiero insertar y modificar tablas, para incorporar información estructurada compatible con LaTeX.

- **Prioridad:** P2 🟡
- **Story Points:** 8
- **Sprint sugerido:** Sprint 3
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto un entorno `tabular` con filas y columnas definidas, **then** aparece correctamente en la vista previa.
2. **Given** una tabla insertada, **when** modifico su contenido (celdas, alineación, bordes), **then** los cambios se reflejan correctamente tras recompilar.

#### HU-16: Insertar y modificar ecuaciones
> Como usuario, quiero insertar y modificar ecuaciones, para incorporar expresiones matemáticas compatibles con LaTeX.

- **Prioridad:** P2 🟡
- **Story Points:** 8
- **Sprint sugerido:** Sprint 4
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto una ecuación en entorno `equation` o `$$`, **then** se representa correctamente en la vista previa.
2. **Given** una ecuación existente, **when** la modifico, **then** la vista previa refleja la modificación tras la actualización.

#### HU-17: Referencias bibliográficas y bibliografía
> Como usuario, quiero gestionar referencias bibliográficas y generar la bibliografía, para citar las fuentes utilizadas.

- **Prioridad:** P3 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 8
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto una referencia bibliográfica (`\cite{}`), **then** queda asociada al documento y al archivo `.bib`.
2. **Given** referencias agregadas, **when** genero la bibliografía (`\bibliography`), **then** las fuentes aparecen correctamente formateadas.
3. **Given** una referencia modificada, **when** regenero la bibliografía, **then** esta se actualiza reflejando el cambio.

#### HU-18: Notas al pie
> Como usuario, quiero insertar y modificar notas al pie, para añadir información complementaria al contenido.

- **Prioridad:** P4 🔴
- **Story Points:** 3
- **Sprint sugerido:** Sprint 9
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto `\footnote{}`, **then** aparecen la referencia numérica y el contenido de la nota en la parte inferior de la página.
2. **Given** una nota existente, **when** modifico su contenido, **then** el cambio se refleja correctamente en la siguiente compilación.

#### HU-19: Bloques de código con lenguaje
> Como usuario, quiero insertar y editar bloques de código con su lenguaje, para documentar código de programación.

- **Prioridad:** P3 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 8
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento, **when** inserto un bloque de código (ej: entorno `lstlisting` o `verbatim`), **then** aparece correctamente con formato monoespaciado.
2. **Given** un bloque de código, **when** especifico el lenguaje de programación, **then** el lenguaje queda asociado al bloque para resaltado de sintaxis si aplica.
3. **Given** un bloque existente, **when** modifico su contenido, **then** los cambios se conservan en el código fuente.

#### HU-20: Generar y actualizar índice
> Como usuario, quiero generar y actualizar el índice del documento, para reflejar su estructura de secciones.

- **Prioridad:** P3 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 8
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un documento con varias secciones, **when** genero el índice (`\tableofcontents`), **then** las secciones y subsecciones aparecen listadas con números de página.
2. **Given** un documento cuya estructura cambió, **when** actualizo el índice, **then** refleja la nueva estructura y page numbers actualizados.

---

### E5 — Vista Previa y Compilación

**Objetivo de negocio:** Cerrar el ciclo de edición con renderizado visual en tiempo real y exportación a PDF.

**RF que agrupa:** RF-13, RF-14, RF-36, RF-37, RF-38, RF-39, RF-40 (+ RNF-04)

#### HU-21: Vista previa con actualización automática
> Como usuario, quiero ver una vista previa visual del documento que se actualice automáticamente al editar, para observar los cambios en tiempo real mientras elaboro el contenido.

- **Prioridad:** P1 🟢
- **Story Points:** 8
- **Sprint sugerido:** Sprint 2
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento válido, **when** lo creo o lo abro, **then** se muestra su representación visual renderizada.
2. **Given** que edito el documento (código o visual), **when** finalizo la modificación, **then** la vista previa se actualiza automáticamente sin necesidad de acción manual.
3. **Given** una modificación en un documento de prueba estándar, **when** se mide el tiempo entre la modificación y la actualización de la vista previa, **then** no supera los 200 ms.
4. **Given** un documento con errores de compilación, **when** modifico el contenido, **then** la vista previa muestra el último estado válido conocido e indica visualmente la existencia de errores.
5. **Given** un documento sin contenido válido o vacío, **when** intento previsualizarlo, **then** el sistema muestra un estado vacío en lugar de una vista errónea o un mensaje de error intimidante.

#### HU-23: Compilar documento LaTeX
> Como usuario, quiero compilar el código LaTeX, para obtener una representación procesada del documento.

- **Prioridad:** P1 🟢
- **Story Points:** 8
- **Sprint sugerido:** Sprint 2
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento con código LaTeX válido, **when** ejecuto la compilación (botón o atajo), **then** el proceso finaliza correctamente generando salida procesada.
2. **Given** una compilación en curso, **when** el proceso avanza, **then** el sistema muestra indicador de progreso o estado.
3. **Given** una compilación finalizada correctamente, **when** el sistema procesa el documento, **then** el resultado está disponible para la vista previa o exportación.

#### HU-24: Informar errores de compilación
> Como usuario, quiero que se me informe de los errores de compilación con su ubicación, para corregir el documento rápidamente.

- **Prioridad:** P1 🟢
- **Story Points:** 5
- **Sprint sugerido:** Sprint 3
- **MVP:** Sí *(Nota: parte del MVP funcional, pero puede moverse a Sprint 3 si Sprint 2 se satura)*

**Criterios de Aceptación:**
1. **Given** un documento con un error de sintaxis LaTeX, **when** ejecuto la compilación, **then** el sistema informa claramente la existencia del error sin bloquear la app.
2. **Given** un error con información de ubicación proporcionada por el compilador, **when** se produce el error, **then** el sistema indica la línea y/o posición aproximada del error en el editor.
3. **Given** múltiples errores en el documento, **when** compilo, **then** el sistema muestra una lista navegable de errores para corregirlos secuencialmente.

#### HU-25: Exportar documento a PDF
> Como usuario, quiero exportar el documento a PDF, para distribuirlo o entregarlo.

- **Prioridad:** P1 🟢
- **Story Points:** 3
- **Sprint sugerido:** Sprint 2
- **MVP:** Sí

**Criterios de Aceptación:**
1. **Given** un documento compilado correctamente, **when** ejecuto la exportación a PDF, **then** se genera un archivo `.pdf` en la ubicación seleccionada.
2. **Given** un documento sin compilación exitosa previa, **when** intento exportar, **then** el sistema informa que se requiere compilación exitosa primero y no genera PDF corrupto.
3. **Given** la exportación completada, **when** abro el PDF generado, **then** el contenido refleja fielmente el documento editado.

---

### E6 — Control de Versiones con GitHub (Post-MVP)

**Objetivo de negocio:** Facilitar la gestión y colaboración de documentos mediante integración nativa con GitHub.

**RF que agrupa:** RF-42, RF-43, RF-44, RF-45

#### HU-26: Autenticar cuenta de GitHub
> Como usuario, quiero autenticar mi cuenta de GitHub, para conectarme a mis repositorios desde la aplicación.

- **Prioridad:** P2 🟡
- **Story Points:** 3
- **Sprint sugerido:** Sprint 7
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** que solicito acceder a GitHub, **when** completo la autenticación OAuth, **then** el sistema reconoce mi cuenta y muestra mis repositorios accesibles.
2. **Given** una sesión autenticada, **when** reinicio la aplicación, **then** la conexión se mantiene o solicita renovar el token de forma transparente.

#### HU-27: Obtener cambios (pull)
> Como usuario, quiero obtener los cambios de un repositorio remoto de GitHub, para actualizar mi proyecto local.

- **Prioridad:** P2 🟡
- **Story Points:** 5
- **Sprint sugerido:** Sprint 7
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un repositorio remoto con cambios nuevos, **when** ejecuto la operación de pull, **then** los cambios se incorporan al proyecto local.
2. **Given** un proyecto local con cambios sin confirmar que entran en conflicto, **when** intento obtener cambios, **then** el sistema informa del conflicto y ofrece opciones de resolución básicas.

#### HU-28: Registrar cambios (commit)
> Como usuario, quiero registrar mis cambios mediante un commit, para conservar un punto de control en el historial.

- **Prioridad:** P2 🟡
- **Story Points:** 3
- **Sprint sugerido:** Sprint 7
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** un proyecto con modificaciones pendientes, **when** ejecuto commit y proporciono un mensaje descriptivo, **then** el cambio aparece en el historial local de Git.
2. **Given** un commit realizado, **when** reviso el historial de la app, **then** aparece con el mensaje, autor y timestamp correspondientes.

#### HU-29: Subir cambios (push)
> Como usuario, quiero subir mis commits al repositorio remoto, para sincronizar mi proyecto con GitHub.

- **Prioridad:** P2 🟡
- **Story Points:** 3
- **Sprint sugerido:** Sprint 7
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** commits locales pendientes, **when** ejecuto push, **then** los commits aparecen en el repositorio remoto de GitHub.
2. **Given** un push exitoso, **when** reviso el repositorio remoto, **then** está sincronizado con el estado actual del proyecto local.

---

### E7 — Colaboración en Tiempo Real (Futuro)

**Objetivo de negocio:** Permitir que múltiples usuarios editen simultáneamente un mismo documento.

**RF que agrupa:** RF-53

#### HU-30: Colaboración en tiempo real
> Como usuario, quiero editar un documento simultáneamente con otros usuarios, para colaborar en la elaboración de la documentación.

- **Prioridad:** Futuro 🔴
- **Story Points:** 13
- **Sprint sugerido:** Backlog (sin sprint asignado)
- **MVP:** No

**Criterios de Aceptación:**
1. **Given** dos usuarios conectados al mismo documento compartido, **when** el usuario A realiza una modificación, **then** el usuario B observa dicha modificación en su pantalla en tiempo real.
2. **Given** dos usuarios editando en paralelo, **when** ambos modifican el mismo fragmento simultáneamente, **then** el sistema gestiona el conflicto sin pérdida de contenido de ningún usuario.
3. **Given** un usuario que pierde la conexión, **when** se reconecta, **then** recibe los cambios pendientes y puede continuar editando.

---

## 4. Product Backlog Priorizado

| Prioridad | HU-ID | Historia | Épica | SP | Sprint | MVP |
|---|---|---|---|:---:|:---:|:---:|
| P1 | HU-00 | Configurar motor LaTeX | E0 | 5 | Sprint 0 | 🟢 |
| P1 | HU-01 | Crear documento nuevo | E1 | 1 | Sprint 1 | 🟢 |
| P1 | HU-02 | Abrir documento LaTeX | E1 | 2 | Sprint 1 | 🟢 |
| P1 | HU-03 | Guardar documento en formato .tex | E1 | 2 | Sprint 1 | 🟢 |
| P1 | HU-04 | Escribir y modificar código LaTeX | E2 | 5 | Sprint 1 | 🟢 |
| P1 | HU-12 | Insertar y editar texto | E4 | 2 | Sprint 1 | 🟢 |
| P1 | HU-13 | Insertar y modificar secciones | E4 | 2 | Sprint 1 | 🟢 |
| P1 | HU-21 | Vista previa con actualización automática | E5 | 8 | Sprint 2 | 🟢 |
| P1 | HU-23 | Compilar documento LaTeX | E5 | 8 | Sprint 2 | 🟢 |
| P1 | HU-25 | Exportar documento a PDF | E5 | 3 | Sprint 2 | 🟢 |
| P1 | HU-14 | Insertar y ajustar imágenes | E4 | 5 | Sprint 2 | 🟢 |
| P1 | HU-24 | Informar errores de compilación | E5 | 5 | Sprint 3 | 🟢 |
| P2 | HU-15 | Insertar y modificar tablas | E4 | 8 | Sprint 3 | 🟡 |
| P2 | HU-05 | Copiar y pegar contenido | E2 | 3 | Sprint 3 | 🟡 |
| P2 | HU-07 | Cambiar modo de edición | E3 | 5 | Sprint 3 | 🟡 |
| P2 | HU-16 | Insertar y modificar ecuaciones | E4 | 8 | Sprint 4 | 🟡 |
| P2 | HU-08 | Panel de componentes visuales | E3 | 3 | Sprint 4 | 🟡 |
| P2 | HU-09 | Insertar componente visual (texto y secciones) | E3 | 5 | Sprint 4 | 🟡 |
| P2 | HU-10 | Insertar componentes visuales avanzados | E3 | 8 | Sprint 5 | 🟡 |
| P2 | HU-11 | Sincronización bidireccional código ↔ visual | E3 | 13 | Sprint 6 | 🟡 |
| P2 | HU-26 | Autenticar cuenta de GitHub | E6 | 3 | Sprint 7 | 🟡 |
| P2 | HU-28 | Registrar cambios (commit) | E6 | 3 | Sprint 7 | 🟡 |
| P2 | HU-29 | Subir cambios (push) | E6 | 3 | Sprint 7 | 🟡 |
| P2 | HU-27 | Obtener cambios (pull) | E6 | 5 | Sprint 7 | 🟡 |
| P3 | HU-17 | Referencias bibliográficas y bibliografía | E4 | 5 | Sprint 8 | 🟡 |
| P3 | HU-19 | Bloques de código con lenguaje | E4 | 5 | Sprint 8 | 🟡 |
| P3 | HU-20 | Generar y actualizar índice | E4 | 5 | Sprint 8 | 🟡 |
| P4 | HU-18 | Notas al pie | E4 | 3 | Sprint 9 | 🟡 |
| P4 | HU-06 | Menú contextual | E2 | 3 | Sprint 9 | 🟡 |
| Futuro | HU-30 | Colaboración en tiempo real | E7 | 13 | Backlog | 🔴 |

---

## 5. MVP Definido

El **MVP (Producto Mínimo Viable)** se define como el conjunto de funcionalidades que permiten a un usuario crear, editar, compilar y exportar un documento LaTeX básico sin fricciones. El objetivo es tener algo **usable en 2 semanas**.

### Filosofía del MVP
> *"Si en 2 semanas no puedo escribir un documento técnico básico y exportarlo a PDF, el proyecto está muerto. Todo lo demás es decoración."*

### Historias que conforman el MVP

| Sprint | Historias | Entregable clave |
|---|---|---|
| **Sprint 0** | HU-00 | La app detecta/instala el compilador LaTeX y compila "Hola Mundo" |
| **Sprint 1** | HU-01, HU-02, HU-03, HU-04, HU-12, HU-13 | Puedo crear, abrir, guardar y editar un documento `.tex` con texto y secciones |
| **Sprint 2** | HU-21, HU-23, HU-25, HU-14 | Puedo ver preview en tiempo real, compilar, exportar PDF e insertar imágenes |
| **Sprint 3** | HU-24 | Puedo ver errores de compilación con ubicación exacta para corregirlos |

**Total MVP:** 11 historias | **SP totales MVP:** 41

### ¿Qué queda FUERA del MVP (y por qué)?

| Funcionalidad | Razón de exclusión del MVP |
|---|---|
| Modo visual / Híbrido (E3) | Es el diferencial, pero requiere que el modo código sea sólido primero. Se construye sobre la base estable del MVP. |
| Tablas, ecuaciones, bibliografía (E4 avanzado) | Elementos complejos que requieren UI dedicada. El MVP cubre texto, secciones e imágenes. |
| GitHub (E6) | El usuario puede usar Git por terminal mientras tanto. Es cómodo, no esencial para validar el producto. |
| Menú contextual (HU-06) | Atajo de UX; los atajos de teclado (`Ctrl+C/V`) cubren el 90% del flujo. |
| Colaboración real-time (HU-30) | Explícitamente marcado como futuro desde los requerimientos originales. |

---

## 6. Sprint Planning Sugerido

| Sprint | Meta del sprint | Historias incluidas | SP total | Entregable demoable |
|---|---|---|:---:|:---|
| **Sprint 0** | La app compila "Hola Mundo" LaTeX | HU-00 | 5 | App abre, detecta compilador, renderiza documento mínimo |
| **Sprint 1** | Editor básico funcional | HU-01, HU-02, HU-03, HU-04, HU-12, HU-13 | 14 | Creo un documento con texto y secciones, lo guardo, lo cierro, lo reabro |
| **Sprint 2** | Cierre del ciclo: compilar, ver, exportar | HU-21, HU-23, HU-25, HU-14 | 24 | Escribo LaTeX, veo preview en tiempo real, exporto PDF con imágenes |
| **Sprint 3** | Robustecer y agregar tablas | HU-24, HU-15, HU-05, HU-07 | 21 | Manejo de errores, tablas, portapapeles y cambio de modo |
| **Sprint 4** | Ecuaciones y panel visual | HU-16, HU-08, HU-09 | 16 | Panel de componentes básicos y ecuaciones renderizadas |
| **Sprint 5** | Componentes visuales completos | HU-10 | 8 | Tablas, imágenes y ecuaciones vía componentes visuales |
| **Sprint 6** | Sincronización híbrida | HU-11 | 13 | Modo híbrido real: código y visual se actualizan mutuamente |
| **Sprint 7** | Integración GitHub | HU-26, HU-27, HU-28, HU-29 | 14 | Commit, push, pull desde la interfaz sin terminal |
| **Sprint 8** | Documentación académica completa | HU-17, HU-19, HU-20 | 15 | Bibliografía, bloques de código e índice automático |
| **Sprint 9** | Pulido de UX | HU-18, HU-06 | 6 | Notas al pie y menú contextual |

> **Nota para 1 persona:** Si un sprint se siente sobrecargado (especialmente Sprint 2 con 24 SP), mover la historia de menor impacto (HU-14: imágenes) al Sprint 3. El MVP sigue siendo válido si en Sprint 2 se entrega: crear → editar → compilar → preview → PDF.

---

## 7. DoR y DoD

### Definition of Ready (DoR) — Antes de entrar al sprint

Una historia está lista para desarrollarse cuando cumple **TODAS** estas condiciones:

1. ✅ Tiene formato "Como…, quiero…, para que…" y pertenece a una sola épica.
2. ✅ Tiene entre 2 y 4 Criterios de Aceptación en formato Given-When-Then, verificables y sin ambigüedad.
3. ✅ Tiene Story Points asignados y prioridad definida (P1/P2/P3/P4/Futuro).
4. ✅ Sus dependencias de historias de sprints anteriores están completadas o identificadas.
5. ✅ No duplica otra historia del backlog (se validó contra RF fusionados).
6. ✅ Los RNF aplicables (offline, multiplataforma, rendimiento ≤200 ms) están mapeados como criterios si afectan la historia.
7. ✅ El equipo de 1 persona puede completarla dentro de 1 semana (SP ≤ 8; si es mayor, se descompone).
8. ✅ Se conoce el "cómo probarlo" manualmente al finalizar.

### Definition of Done (DoD) — Para considerar la historia cerrada

Una historia se da por terminada cuando cumple **TODAS** estas condiciones:

1. ✅ Todos los Criterios de Aceptación se cumplen y se demuestran con verificación manual en el entorno local.
2. ✅ La funcionalidad funciona 100 % offline (salvo historias de GitHub, que requieren red y manejan la ausencia de conexión con un mensaje claro).
3. ✅ Se probó en al menos 2 de las 3 plataformas objetivo (Windows, Linux, macOS); las 3 antes del release final.
4. ✅ El flujo completo no se corrompe: crear → editar → guardar → compilar → preview → exportar PDF.
5. ✅ Los errores se manejan con mensajes comprensibles y no bloquean el resto de la aplicación.
6. ✅ El código generado por componentes visuales (si aplica) se conserva en sintaxis LaTeX estándar.
7. ✅ No se introducen dependencias de red inesperadas ni se compromete el requisito de rendimiento de la vista previa (≤200 ms).
8. ✅ La historia queda marcada como "Done" en el backlog y, si procede, con el commit correspondiente referenciado.
9. ✅ Se actualizó el `CHANGELOG.md` o notas de release si la historia es visible para el usuario.

---

## 8. Riesgos y Supuestos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|:---:|:---|
| **El compilador LaTeX no se integra bien** con el framework elegido | Media | 🔴 Alto | Validar en Sprint 0 con un "Hola Mundo" real. Si falla, pivotar a motor embebido (latex.js) o requerir instalación manual documentada. |
| **La sincronización bidireccional código↔visual (HU-11)** es más compleja de lo estimado | Alta | 🟡 Medio | Dividir en 2 sprints si es necesario. Primero código→visual, luego visual→código. |
| **Rendimiento de vista previa > 200ms** en documentos grandes | Media | 🟡 Medio | Implementar compilación incremental o debounce. El RNF permite "documentos de prueba estándar", no tesis de 200 páginas. |
| **Agotamiento por scope grande** en equipo de 1 persona | Alta | 🔴 Alto | Respetar el MVP de 2 sprints. Si se atrasa, sacrificar HU-14 (imágenes) del MVP, no el core. |
| **GitHub API cambia** o limita requests | Baja | 🟢 Bajo | Usar librería estándar (libgit2, octokit). Mantener autenticación simple (token personal). |
| **Colaborador ocasional no está disponible** cuando se necesita | Media | 🟡 Medio | Documentar decisiones técnicas en `ADRs.md` para que el colaborador se ponga al rápido. |

### Supuestos fundamentales

1. El usuario tiene permisos de escritura en el sistema de archivos local.
2. El usuario puede instalar software adicional si la app lo requiere (compilador LaTeX).
3. Para GitHub, el usuario tiene cuenta existente y conoce conceptos básicos de Git.
4. La app no reemplaza un IDE LaTeX profesional; apunta a documentación técnica de software de complejidad media.
5. El modo visual no necesita ser tan potente como Overleaf; debe cubrir el 80% de casos de uso comunes.

---

> **Documento generado para Scrum adaptado a 1 persona. MVP = Sprints 0–2 (3 semanas). Producto completo estimado = 9 sprints.**
