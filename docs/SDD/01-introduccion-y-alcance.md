# SDD 01 — Introducción y Alcance del Sistema

## 1.1 Propósito
El objetivo de este documento de diseño de software (SDD) es definir la arquitectura técnica, los límites de dominio y las decisiones estructurales para la implementación de **Layratex**: un editor de documentación técnica LaTeX híbrido (código + componentes visuales), reactivo y descentralizado, fundamentado en los paradigmas **Local-First** y redes **Peer-to-Peer (P2P)**.

## 1.2 Alcance del Sistema
Layratex permite:
1. **Edición Híbrida Bidireccional:** Trabajar documentos LaTeX tanto mediante escritura de código plano como mediante interfaz visual de bloques (secciones, tablas, ecuaciones, imágenes, referencias), sincronizando ambos mundos en tiempo real.
2. **Sincronización P2P Multi-dispositivo:** Los usuarios pueden vincular sus propios dispositivos (laptops, estaciones de escritorio) mediante un handshake criptográfico (ej. código QR), sincronizando sus proyectos a través de Internet o red local sin necesidad de un servidor central propietario.
3. **Colaboración Distribuida en Tiempo Real y Asíncrona:** Compartir documentos de forma segura con otros colaboradores vía enlaces P2P con cifrado extremo a extremo (E2EE).
4. **Local-First & Offline Resilience:** Toda la información vive primariamente en el disco local del usuario. La aplicación funciona con un 100% de capacidades de edición, renderizado y compilación sin conexión a Internet.
5. **Control de Versiones Híbrido:** Integración nativa con Git como backend opcional de exportación y ramas, complementando la sincronización en vivo P2P.

## 1.3 Principios Arquitectónicos Fundamentales
* **Disponibilidad Incondicional (Local-First):** La red nunca bloquea la experiencia de usuario. Las operaciones locales son inmediatas (latencia percibida de 0ms). La sincronización es eventual y asíncrona.
* **Soberanía y Zero-Knowledge:** Los datos pertenecen exclusivamente a los usuarios. Los servidores auxiliares (STUN/TURN, señalización) no almacenan documentos ni poseen claves criptográficas de descifrado.
* **Convergencia Determinista (CRDT):** Todas las modificaciones concurrentes convergen matemáticamente al mismo estado final sin requerir un coordinador central ni crear archivos de conflicto destructivos.
* **Separación de Dominios (DDD):** Desacoplamiento estricto entre el motor de persistencia/CRDT, la capa de transporte P2P, el motor de compilación LaTeX y la interfaz gráfica.

## 1.4 Glosario Técnico
* **CRDT (Conflict-free Replicated Data Type):** Estructura de datos que puede replicarse concurrentemente en múltiples nodos y converger de manera autónoma sin conflictos.
* **Peer (Par / Nodo):** Instancia de Layratex en ejecución en un dispositivo concreto del usuario.
* **Swarm (Enjambre):** Conjunto de peers interconectados que comparten un espacio de trabajo o documento común.
* **Device Identity:** Identificador criptográfico basado en un par de claves asimétricas (Ed25519) generado localmente en el dispositivo.
* **Signaling / Rendezvous:** Mecanismo ligero para el intercambio inicial de direcciones IP/puertos y candidatos ICE para establecer conexiones P2P directas.
* **AST (Abstract Syntax Tree):** Árbol sintáctico que representa la estructura semántica de un documento LaTeX para su edición visual y reactiva.
