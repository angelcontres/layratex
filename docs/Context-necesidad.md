### USUARIO
https://excalidraw.com/#room=01d9072df88f291b79e5,buy9HMFH7I5HhAb57vsXmw
# Necesidad del usuario: Layratex (Local-First & P2P)

El usuario necesita una aplicación de escritorio multiplataforma para la creación, edición y sincronización de documentación técnica basada en LaTeX, que combine la flexibilidad de un editor de código con la facilidad de uso de un procesador de textos visual, operando bajo el paradigma **Local-First** y una red **Peer-to-Peer (P2P)**.

### 1. Experiencia de Edición Híbrida y Compilación Local
La aplicación deberá permitir al usuario elegir libremente la forma de edición que prefiera:
* Escribir directamente código LaTeX estándar.
* Utilizar componentes o controles visuales que generen y sincronicen código LaTeX automáticamente.
* Combinar ambos enfoques mediante una interfaz híbrida reactiva y bidireccional.

El usuario necesita visualizar el resultado del documento mientras lo desarrolla mediante un sistema de renderizado reactivo e incremental, compatible con texto, secciones, tablas, imágenes, ecuaciones, bibliografía y bloques de código. Todo el proceso de edición, almacenamiento y compilación debe funcionar de forma local sin requerir conexión a Internet. Los documentos podrán exportarse a PDF y mantenerse en formato `.tex` estándar.

### 2. Red Peer-to-Peer (P2P) y Sincronización Multi-dispositivo
El usuario moderno trabaja en múltiples estaciones de trabajo (por ejemplo: laptop personal, PC de escritorio, estación del laboratorio). Por ello, el sistema deberá implementar una **red Peer-to-Peer (P2P)** que comunique directamente los dispositivos del usuario a través de Internet o red de área local:
* **Identidad Soberana y Emparejamiento Seguro:** Cada instalación de la aplicación poseerá una identidad criptográfica (par de llaves pública/privada). El usuario podrá vincular sus dispositivos de forma rápida y segura (mediante códigos QR, frases de emparejamiento o tokens temporales) sin depender de cuentas en la nube propietaria de terceros.
* **Sincronización Local-First:** Cada dispositivo mantiene una copia local íntegra del estado de los documentos. Cuando los dispositivos se descubren en la red P2P (vía Internet o LAN), sincronizan automáticamente sus cambios en segundo plano.
* **Tolerancia a Desconexión y Resolución de Conflictos (CRDT):** El usuario podrá trabajar sin conexión en cualquiera de sus dispositivos. Al restablecerse la conectividad, las modificaciones concurrentes deberán fusionarse automáticamente sin pérdida de datos ni sobreescrituras accidentales mediante estructuras de datos libres de conflicto (CRDT).

### 3. Colaboración P2P y Control de Versiones Complementario
* **Colaboración Directa:** El usuario podrá compartir espacios de trabajo o documentos específicos con otros pares/usuarios mediante enlaces o claves de invitación seguras, habilitando edición simultánea en tiempo real sin servidores centrales de datos (Zero-Knowledge / Cifrado E2EE).
* **Control de Versiones Git:** Complementariamente a la red P2P, la aplicación mantendrá integración opcional con repositorios Git (ej. GitHub/GitLab) para control de versiones formal, ramas, commits, pull y push.

### 4. Diagnóstico y Asistencia
Cuando el documento presente inconsistencias o errores de compilación LaTeX, el sistema informará al usuario indicando con precisión la línea, archivo y causa del problema para facilitar su resolución inmediata.

