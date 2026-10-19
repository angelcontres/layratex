# Layratex — Software Design Document (SDD)
## Arquitectura Local-First, Peer-to-Peer (P2P) y Editor Híbrido LaTeX

Bienvenido a la especificación técnica y de arquitectura del proyecto **Layratex**. Este conjunto de documentos define la fase 2 (Diseño del Sistema) con enfoque de diseño guiado por el dominio (**DDD - Domain-Driven Design**) y modelado arquitectónico **C4**.

---

### Índice de Documentos de Diseño (Módulos 1 al 8)

| Módulo | Documento | Descripción |
| :--- | :--- | :--- |
| **01** | [`01-introduccion-y-alcance.md`](./01-introduccion-y-alcance.md) | Propósito, alcance, principios rectores Local-First y glosario técnico. |
| **02** | [`02-arquitectura-c4.md`](./02-arquitectura-c4.md) | Vistas arquitectónicas bajo el modelo C4 (Contexto, Contenedores y Componentes). |
| **03** | [`03-modelo-de-dominio-ddd.md`](./03-modelo-de-dominio-ddd.md) | Bounded Contexts, agregados, entidades, value objects y eventos de dominio. |
| **04** | [`04-protocolo-p2p-y-red.md`](./04-protocolo-p2p-y-red.md) | Topología de enjambre P2P, descubrimiento, NAT traversal (STUN/TURN) y transporte. |
| **05** | [`05-modelo-de-datos-y-crdt.md`](./05-modelo-de-datos-y-crdt.md) | Replicación de estado sin conflictos (CRDTs), estructura de documentos y almacenamiento local. |
| **06** | [`06-motor-latex-y-pipeline.md`](./06-motor-latex-y-pipeline.md) | Motor de renderizado reactivo, parser bidireccional (LaTeX ⇄ Visual) y compilador. |
| **07** | [`07-seguridad-y-criptografia.md`](./07-seguridad-y-criptografia.md) | Identidad soberana de dispositivo (Ed25519), emparejamiento QR, Noise Protocol y cifrado E2EE. |
| **08** | [`08-plataforma-y-despliegue.md`](./08-plataforma-y-despliegue.md) | Estrategia de ejecución multiplataforma, empaquetado y gestión del runtime LaTeX. |

---

### Registro de Decisiones de Arquitectura (ADR)
Las decisiones tecnológicas y de diseño fundamentales se encuentran documentadas en [`docs/ADR/`](../ADR/README.md).
