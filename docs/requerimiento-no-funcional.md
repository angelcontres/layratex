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

## RNF-06 — Cifrado Extremo a Extremo (E2EE) en comunicaciones P2P

**DESCRIPCIÓN:**  
El sistema deberá cifrar el 100 % del tráfico de sincronización y mensajes P2P mediante criptografía moderna de extremo a extremo (E2EE), asegurando confidencialidad e integridad sin intermediarios con acceso en texto plano.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Capturar paquetes de red durante una sesión de sincronización P2P entre dos dispositivos y comprobar mediante análisis de tráfico que no es posible descifrar ni visualizar el contenido del documento sin la clave privada del usuario.

## RNF-07 — Latencia de propagación P2P

**DESCRIPCIÓN:**  
El sistema deberá propagar y aplicar los deltas de edición entre dispositivos conectados en un tiempo inferior a 500 ms bajo redes locales (LAN) e inferior a 1500 ms bajo conexiones de Internet estándar (con RTT de red < 150 ms).

**PRIORIDAD:** Should

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Medir el tiempo desde la emisión de una operación de edición en el dispositivo A hasta su renderizado en el dispositivo B en condiciones de red controladas.

## RNF-08 — Soberanía y Privacidad Zero-Knowledge

**DESCRIPCIÓN:**  
El sistema deberá garantizar que los servidores de señalización, rendezvous o relays (STUN/TURN) no almacenen metadatos persistentes de los documentos ni tengan acceso a las claves de descifrado, operando bajo un modelo Zero-Knowledge.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Inspeccionar los logs y memoria de los nodos de señalización/relay para constatar que solo manejan tráfico opaco cifrado y direcciones de transporte sin datos de usuario.

## RNF-09 — Convergencia matemática sin pérdida de datos (CRDT)

**DESCRIPCIÓN:**  
El sistema deberá garantizar una convergencia del 100 % en el estado final del documento tras cualquier secuencia arbitraria de ediciones offline y reconexiones concurrentes, sin generación de archivos duplicados de conflicto ni pérdida de operaciones.

**PRIORIDAD:** Must

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Ejecutar batería de pruebas de estrés con múltiples ramas concurrentes de edición asíncrona y verificar que tras el intercambio de deltas todos los nodos obtienen exactamente el mismo árbol sintáctico y texto final.

## RNF-10 — Eficiencia de red y compresión de deltas

**DESCRIPCIÓN:**  
El sistema deberá transmitir únicamente las mutaciones incrementales (deltas u operaciones compactas codificadas en binario) en lugar del documento completo en cada modificación, optimizando el consumo de ancho de banda y batería.

**PRIORIDAD:** Should

**FUENTE:** `Context-necesidad.md`

**CRITERIO DE VERIFICACIÓN:**  
Monitorear el tamaño de carga transmitida por cada pulsación o cambio de párrafo y validar que el tamaño de paquete delta promedio no exceda los 2 KB.