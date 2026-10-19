# Architecture Decision Records (ADR) — Layratex

Este directorio contiene el registro formal de las decisiones arquitectónicas clave tomadas durante la concepción, diseño e implementación del proyecto **Layratex**.

Cada registro sigue la estructura estándar **MADR / Nygard**:
* **Estado:** Propuesto / Aceptado / Reemplazado.
* **Contexto:** Problema a resolver y fuerzas en conflicto.
* **Decisión:** La alternativa elegida y por qué.
* **Consecuencias:** Beneficios, contrapartidas y mitigaciones.

---

### Índice de Decisiones de Arquitectura

| ADR | Título | Estado | Fecha |
| :---: | :--- | :---: | :---: |
| [ADR-001](./ADR-001-arquitectura-local-first-y-crdt.md) | Adopción del paradigma Local-First y estructuras CRDT sobre OT | **Aceptado** | 2026-10-19 |
| [ADR-002](./ADR-002-transporte-p2p-y-hole-punching.md) | Capa de Transporte P2P con Travesía NAT y WebRTC / libp2p | **Aceptado** | 2026-10-19 |
| [ADR-003](./ADR-003-emparejamiento-criptografico-de-dispositivos.md) | Emparejamiento descentralizado de dispositivos mediante QR y Noise Protocol | **Aceptado** | 2026-10-19 |
| [ADR-004](./ADR-004-seleccion-stack-tecnologico.md) | Selección del Stack Tecnológico del Cliente de Escritorio y Core P2P (Tauri + Rust + TS) | **Aceptado** | 2026-10-19 |

