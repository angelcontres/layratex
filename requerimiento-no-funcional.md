# Requisitos no funcionales

## RNF-01 — Compatibilidad multiplataforma

**DESCRIPCIÓN:**  
El sistema deberá alcanzar una compatibilidad funcional mínima del 95 % bajo los sistemas operativos Windows, Linux y macOS soportados.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Ejecutar las funcionalidades definidas para la prueba en Windows, Linux y macOS, y calcular el porcentaje de funcionalidades ejecutadas correctamente en cada sistema operativo. El resultado deberá ser igual o superior al 95 %.
  

## RNF-02 — Funcionamiento sin conexión

**DESCRIPCIÓN:**  
El sistema deberá mantener una disponibilidad funcional del 100 % para las operaciones locales de creación, edición, visualización, compilación y almacenamiento bajo condiciones de ausencia de conexión a Internet.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Desconectar el equipo de Internet, ejecutar la aplicación y realizar las operaciones locales definidas. El 100 % de las operaciones incluidas en la prueba deberá ejecutarse correctamente sin conexión.


## RNF-03 — Usabilidad

**DESCRIPCIÓN:**  
El sistema deberá alcanzar un porcentaje mínimo de éxito del 80 % en la realización de las tareas básicas de creación, edición, guardado y exportación bajo pruebas de usabilidad con usuarios participantes.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Realizar una prueba de usabilidad con los usuarios participantes y calcular el porcentaje de usuarios que completan correctamente las tareas definidas sin asistencia. El porcentaje deberá ser igual o superior al 80 %.

## RNF-04 — Rendimiento de la vista previa

**DESCRIPCIÓN:**  
El sistema deberá actualizar la vista previa en un tiempo máximo de 200 ms bajo modificaciones realizadas sobre documentos de prueba que puedan ser procesados dentro del intervalo establecido.

**PRIORIDAD:** Should

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Realizar modificaciones sobre documentos de prueba, medir el tiempo transcurrido entre la modificación y la actualización de la vista previa, y comprobar que el tiempo de actualización no supere los 200 ms en los escenarios definidos.

## RNF-05 — Compatibilidad con LaTeX

**DESCRIPCIÓN:**  
El sistema deberá alcanzar una compatibilidad mínima del 95 % con las estructuras LaTeX soportadas por la aplicación bajo documentos de prueba que contengan dichas estructuras.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Crear documentos que contengan las estructuras LaTeX soportadas, compilar los documentos mediante un compilador LaTeX compatible y calcular el porcentaje de estructuras procesadas correctamente. El resultado deberá ser igual o superior al 95 %.