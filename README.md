# Layratex — Local-First P2P Hybrid LaTeX Editor

Editor de documentación técnica LaTeX híbrido (código + componentes visuales) de alta eficiencia, diseñado bajo el paradigma **Local-First** y una red **Peer-to-Peer (P2P)** para sincronización directa entre dispositivos y colaboración sin servidores centrales propietarios.

---

## Estado del Proyecto: Fase 2 — Diseño de Software (SDD & ADR)

* **Fase 1: Requerimientos (Completada & Actualizada):**
  * [Contexto y Necesidad del Usuario](docs/Context-necesidad.md)
  * [Requerimientos Funcionales (RF-01 al RF-62)](docs/requerimiento-funcional.md)
  * [Requerimientos No Funcionales (RNF-01 al RNF-10)](docs/requerimiento-no-funcional.md)
  * [Backlog de Tareas](docs/backlog.md)

* **Fase 2: Documento de Diseño de Software (SDD):**
  * Directorio central: [`docs/SDD/`](docs/SDD/README.md)
  * Módulo 01: [Introducción y Alcance](docs/SDD/01-introduccion-y-alcance.md)
  * Módulo 02: [Arquitectura del Sistema C4](docs/SDD/02-arquitectura-c4.md)
  * Módulo 03: [Modelo de Dominio DDD](docs/SDD/03-modelo-de-dominio-ddd.md)
  * Módulo 04: [Protocolo P2P y Red](docs/SDD/04-protocolo-p2p-y-red.md)
  * Módulo 05: [Modelo de Datos y Motor CRDT](docs/SDD/05-modelo-de-datos-y-crdt.md)
  * Módulo 06: [Motor LaTeX y Pipeline](docs/SDD/06-motor-latex-y-pipeline.md)
  * Módulo 07: [Seguridad, Identidad y Criptografía](docs/SDD/07-seguridad-y-criptografia.md)
  * Módulo 08: [Plataforma, Empaquetado y Despliegue](docs/SDD/08-plataforma-y-despliegue.md)

* **Registro de Decisiones de Arquitectura (ADR):**
  * Directorio: [`docs/ADR/`](docs/ADR/README.md)
  * [ADR-001: Arquitectura Local-First y CRDT](docs/ADR/ADR-001-arquitectura-local-first-y-crdt.md)
  * [ADR-002: Transporte P2P y Travesía NAT (Hole Punching)](docs/ADR/ADR-002-transporte-p2p-y-hole-punching.md)
  * [ADR-003: Emparejamiento Criptográfico de Dispositivos por QR](docs/ADR/ADR-003-emparejamiento-criptografico-de-dispositivos.md)
  * [ADR-004: Selección del Stack Tecnológico (Tauri 2.0 + Rust + TypeScript)](docs/ADR/ADR-004-seleccion-stack-tecnologico.md)


