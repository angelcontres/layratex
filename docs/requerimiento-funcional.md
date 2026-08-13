# Requisitos funcionales

## RF-01 — Crear documento

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario crear un nuevo documento cuando seleccione la opción de crear documento para iniciar la elaboración de documentación.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar la opción de crear documento y comprobar que el sistema genera un nuevo documento disponible para edición.

## RF-02 — Escribir código LaTeX

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario introducir código LaTeX cuando se encuentre editando un documento para elaborar su contenido mediante escritura directa.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear un documento, introducir código LaTeX y comprobar que el contenido ingresado aparece en el editor.

## RF-03 — Modificar código LaTeX

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar código LaTeX cuando exista contenido en el editor para actualizar el contenido del documento mediante escritura directa.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Introducir código LaTeX, modificar una parte del contenido y comprobar que la modificación se conserva en el documento.

## RF-04 — Insertar elementos mediante código LaTeX

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar elementos compatibles con LaTeX cuando edite el código fuente para incorporar nuevos elementos al documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Introducir código correspondiente a un elemento LaTeX y comprobar que el elemento forma parte del documento.

## RF-05 — Crear contenido mediante edición visual

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario crear contenido mediante componentes visuales cuando se encuentre en el modo de edición visual para elaborar documentos sin escribir directamente el código LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Activar el modo visual, utilizar un componente disponible y comprobar que se genera contenido en el documento.

## RF-06 — Modificar contenido mediante edición visual

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar contenido mediante componentes visuales cuando se encuentre en el modo de edición visual para actualizar el documento sin modificar directamente el código LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Activar el modo visual, modificar un elemento existente y comprobar que el cambio se refleja en el documento.  

## RF-07 — Combinar edición LaTeX y visual

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario combinar la edición mediante código LaTeX y componentes visuales cuando utilice el modo híbrido para modificar un mismo documento mediante ambos mecanismos.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar un documento mediante código LaTeX y mediante componentes visuales y comprobar que ambos cambios se conservan.

## RF-08 — Cambiar modo de edición

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario cambiar el modo de edición cuando seleccione una modalidad diferente para utilizar la forma de edición que prefiera.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Cambiar entre los modos de código, visual e híbrido y comprobar que el sistema muestra el modo seleccionado.

## RF-09 — Mostrar componentes visuales

**DESCRIPCIÓN:**  
El sistema deberá mostrar los componentes visuales disponibles cuando el usuario acceda al panel de componentes para facilitar la selección de elementos compatibles con LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-funcional.md`

**CRITERIO DE VERIFICACIÓN:**  
Acceder al panel de componentes y comprobar que se muestran los componentes disponibles.
   
## RF-10 — Seleccionar componente visual

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario seleccionar un componente visual cuando consulte el panel de componentes para elegir el elemento que desea utilizar en el documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Abrir el panel de componentes, seleccionar un componente y comprobar que el sistema identifica el componente seleccionado.

## RF-11 — Insertar componente visual

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar un componente visual seleccionado cuando se encuentre editando un documento para incorporar el elemento correspondiente al documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar un componente, insertarlo y comprobar que el elemento aparece en el documento.

## RF-12 — Generar código LaTeX desde componentes

**DESCRIPCIÓN:**  
El sistema deberá generar código LaTeX correspondiente a un componente visual cuando el usuario lo inserte en el documento para conservar la representación del elemento en el código fuente.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar un componente visual y comprobar que el código LaTeX correspondiente aparece en el código fuente.

## RF-13 — Mostrar vista previa

**DESCRIPCIÓN:**  
El sistema deberá mostrar una vista previa visual del documento cuando exista contenido válido para permitir al usuario observar la representación del documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear o abrir un documento válido y comprobar que se muestra su representación visual.

## RF-14 — Actualizar vista previa

**DESCRIPCIÓN:**  
El sistema deberá actualizar la vista previa cuando el usuario modifique el contenido del documento para mostrar la representación actualizada.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el contenido del documento y comprobar que la vista previa refleja la modificación.

## RF-15 — Insertar texto

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar texto cuando se encuentre editando un documento para incorporar contenido textual.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Introducir texto en el documento y comprobar que el contenido aparece correctamente.

## RF-16 — Modificar texto

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar texto cuando exista contenido textual en el documento para actualizar su contenido.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar texto existente y comprobar que el contenido actualizado permanece en el documento.

## RF-17 — Insertar secciones

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar secciones y subsecciones cuando edite un documento para organizar su contenido mediante estructuras compatibles con LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una sección y una subsección y comprobar que ambas aparecen correctamente en el documento.

## RF-18 — Modificar secciones

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar secciones y subsecciones cuando existan en el documento para actualizar su estructura y contenido.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el título o contenido de una sección y comprobar que el cambio se refleja correctamente.

## RF-19 — Insertar imágenes

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar imágenes cuando se encuentre editando un documento para incorporar contenido gráfico compatible con LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una imagen y comprobar que aparece correctamente en el documento.

## RF-20 — Modificar imágenes

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar las propiedades disponibles de una imagen cuando esta se encuentre insertada en el documento para ajustar su representación.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar una propiedad disponible de una imagen y comprobar que el cambio se refleja en el documento.

## RF-21 — Insertar tablas

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar tablas cuando se encuentre editando un documento para incorporar información estructurada compatible con LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una tabla y comprobar que aparece correctamente en el documento.

## RF-22 — Modificar tablas

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar el contenido de una tabla cuando esta se encuentre insertada en el documento para actualizar la información estructurada.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el contenido de una tabla y comprobar que los cambios se reflejan correctamente.

   

## RF-23 — Insertar ecuaciones

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar ecuaciones cuando se encuentre editando un documento para incorporar expresiones matemáticas compatibles con LaTeX.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una ecuación válida y comprobar que se representa correctamente en la vista previa.

## RF-24 — Modificar ecuaciones

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar ecuaciones cuando estas se encuentren insertadas en el documento para actualizar las expresiones matemáticas.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar una ecuación existente y comprobar que la vista previa refleja la modificación.

## RF-25 — Insertar referencias bibliográficas

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar referencias bibliográficas cuando se encuentre elaborando un documento para asociar fuentes al contenido.

**PRIORIDAD:** Should

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una referencia bibliográfica y comprobar que esta queda asociada al documento.

## RF-26 — Generar bibliografía

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario generar la bibliografía cuando el documento contenga referencias bibliográficas para presentar las fuentes utilizadas.

**PRIORIDAD:** Should

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Agregar referencias bibliográficas, generar la bibliografía y comprobar que las fuentes aparecen correctamente en el documento.

## RF-27 — Seleccionar contenido

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario seleccionar contenido cuando interactúe con el área de edición para realizar operaciones sobre el contenido seleccionado.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar contenido del documento y comprobar que la selección se identifica visualmente.

## RF-28 — Copiar contenido

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario copiar contenido seleccionado cuando ejecute la operación de copiar para reutilizar el contenido en otra ubicación.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar contenido, copiarlo y comprobar que puede ser pegado posteriormente.

**INTERACCIÓN DESEADA:**  
El usuario podrá utilizar `Ctrl+C`.

## RF-29 — Pegar contenido

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario pegar contenido previamente copiado cuando establezca una posición de inserción en el documento para incorporar el contenido copiado.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Copiar contenido, posicionar el cursor en otra ubicación y comprobar que el contenido se pega correctamente.

**INTERACCIÓN DESEADA:**  
El usuario podrá utilizar `Ctrl+V`.

## RF-30 — Mostrar menú contextual

**DESCRIPCIÓN:**  
El sistema deberá mostrar un menú contextual cuando el usuario realice una acción de acceso al menú contextual dentro del área de edición para proporcionar acciones relacionadas con el contenido.

**PRIORIDAD:** Should

**FUENTE:** `Estándar de la industria Office`

**CRITERIO DE VERIFICACIÓN:**  
Realizar clic derecho dentro del área de edición y comprobar que se muestra el menú contextual.

**INTERACCIÓN DESEADA:**  
El menú contextual deberá mostrarse mediante clic derecho.

## RF-31 — Guardar documento

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario guardar un documento cuando seleccione la operación de guardado para conservar los cambios realizados.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar un documento, ejecutar la operación de guardado y comprobar que los cambios quedan almacenados.

## RF-32 — Guardar documento en formato LaTeX

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario guardar el documento en formato LaTeX cuando ejecute la operación de guardado para conservar el código fuente del documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Guardar un documento y comprobar que se genera o actualiza un archivo con extensión `.tex`.

## RF-33 — Seleccionar ubicación para guardar

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario seleccionar una ubicación del sistema de archivos cuando guarde un documento para determinar dónde almacenar el archivo.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar una ubicación, guardar el documento y comprobar que el archivo se encuentra en la ruta seleccionada.

## RF-34 — Abrir documento LaTeX

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario abrir un documento LaTeX existente cuando seleccione un archivo compatible para continuar su edición.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Seleccionar un archivo `.tex` existente y comprobar que su contenido se carga en el editor.

## RF-35 — Seleccionar archivo para abrir

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario seleccionar un archivo del sistema de archivos cuando ejecute la operación de apertura para determinar qué documento desea cargar.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Abrir el selector de archivos, seleccionar un archivo LaTeX y comprobar que el archivo seleccionado es cargado.

## RF-36 — Compilar documento

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario compilar el código LaTeX cuando solicite la compilación para generar una representación procesada del documento.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear un documento con código LaTeX válido, ejecutar la compilación y comprobar que el proceso finaliza correctamente.

## RF-37 — Mostrar resultado de compilación

**DESCRIPCIÓN:**  
El sistema deberá mostrar el resultado de la compilación cuando el proceso de compilación finalice correctamente para permitir al usuario visualizar el documento generado.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Compilar un documento válido y comprobar que el resultado de la compilación se muestra al usuario.

## RF-38 — Informar errores de compilación

**DESCRIPCIÓN:**  
El sistema deberá informar al usuario cuando se produzca un error durante la compilación para permitirle identificar que el documento contiene un problema.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Introducir un error de sintaxis, ejecutar la compilación y comprobar que el sistema informa la existencia del error.

## RF-39 — Indicar ubicación del error

**DESCRIPCIÓN:**  
El sistema deberá indicar la ubicación de un error de compilación cuando el compilador proporcione información sobre su ubicación para facilitar su corrección.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Introducir un error asociado a una línea específica, compilar el documento y comprobar que el sistema indica la ubicación proporcionada por el compilador.

## RF-40 — Exportar documento a PDF

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario exportar un documento a formato PDF cuando la compilación requerida haya finalizado correctamente para generar un archivo destinado a su distribución o entrega.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Compilar un documento válido, ejecutar la exportación a PDF y comprobar que se genera un archivo `.pdf`.

## RF-41 — Generar código LaTeX estándar

**DESCRIPCIÓN:**  
El sistema deberá generar código fuente compatible con la sintaxis estándar de LaTeX cuando cree o modifique elementos compatibles para conservar el documento en un formato editable y reutilizable.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear un documento utilizando elementos soportados, revisar el código fuente generado y comprobar que contiene estructuras LaTeX correspondientes a dichos elementos.

## RF-42 — Autenticar cuenta de GitHub

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario autenticar su cuenta de GitHub cuando solicite acceder a sus repositorios para establecer una conexión con su cuenta.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Ejecutar el proceso de autenticación con GitHub y comprobar que el sistema reconoce la cuenta autenticada.

## RF-43 — Obtener cambios desde GitHub

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario obtener cambios de un repositorio remoto de GitHub cuando solicite actualizar su proyecto local para incorporar los cambios disponibles en el repositorio.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el repositorio remoto, ejecutar la operación de actualización y comprobar que los cambios se incorporan al proyecto local.

## RF-44 — Registrar cambios mediante commit

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario registrar cambios mediante un commit cuando haya modificaciones pendientes en el proyecto para conservar un punto de control en el historial de versiones.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar un documento, ejecutar la operación de commit, proporcionar un mensaje y comprobar que el cambio aparece en el historial de Git.

## RF-45 — Subir cambios a GitHub

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario subir los commits locales al repositorio remoto de GitHub cuando existan cambios registrados para sincronizar el proyecto local con el repositorio remoto.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Realizar un commit local, ejecutar la operación de subida y comprobar que el commit aparece en el repositorio remoto de GitHub.

## RF-46 — Generar índice del documento

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario generar un índice cuando el documento contenga secciones para presentar la estructura del documento.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear un documento con varias secciones, generar el índice y comprobar que las secciones aparecen en él.

## RF-47 — Actualizar índice del documento

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario actualizar el índice cuando se modifique la estructura del documento para reflejar las secciones actuales.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar las secciones de un documento, actualizar el índice y comprobar que refleja la nueva estructura.

## RF-48 — Insertar notas al pie

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar notas al pie cuando se encuentre editando un documento para proporcionar información complementaria asociada al contenido.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar una nota al pie y comprobar que la referencia y el contenido de la nota aparecen correctamente en el documento.

## RF-49 — Modificar notas al pie

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar notas al pie cuando exista una nota asociada al documento para actualizar su contenido.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el contenido de una nota al pie y comprobar que el cambio se refleja correctamente en el documento.

## RF-50 — Insertar bloques de código

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario insertar bloques de código fuente cuando se encuentre editando un documento para incorporar código de programación dentro de la documentación.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar un bloque de código y comprobar que aparece correctamente en el documento.

## RF-51 — Especificar lenguaje de bloque de código

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario especificar el lenguaje de programación de un bloque de código cuando inserte dicho bloque para identificar el lenguaje utilizado.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Insertar un bloque de código, seleccionar un lenguaje de programación y comprobar que el lenguaje queda asociado al bloque.

## RF-52 — Editar bloques de código

**DESCRIPCIÓN:**  
El sistema deberá permitir al usuario modificar el contenido de un bloque de código cuando este se encuentre insertado en el documento para actualizar el código documentado.

**PRIORIDAD:** Should

**FUENTE:** `requerimieto-sin-catalogar.md`

**CRITERIO DE VERIFICACIÓN:**  
Modificar el contenido de un bloque de código y comprobar que los cambios se conservan.

## RF-53 — Editar documento simultáneamente

**DESCRIPCIÓN:**  
El sistema deberá permitir que múltiples usuarios editen simultáneamente un mismo documento cuando se encuentren conectados al documento compartido para colaborar en la elaboración de la documentación.

**PRIORIDAD:** Won't Have (Evolución futura)

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Conectar dos usuarios al mismo documento, realizar una modificación desde el usuario A y comprobar que el usuario B puede observar dicha modificación.