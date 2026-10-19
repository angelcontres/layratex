# ADR-001: Adopción del Paradigma Local-First y Estructuras CRDT sobre OT

## Estado
**Aceptado** (2026-10-19)

## Contexto
Layratex requiere que el usuario pueda trabajar de forma incondicional sin conexión a Internet (en aviones, trenes o zonas sin cobertura) y a la vez sincronizar sus proyectos de forma transparente entre sus múltiples dispositivos (laptop, PC de escritorio) y con otros colaboradores.

Existen dos aproximaciones principales para sincronización concurrente en tiempo real:
1. **Transformación Operacional (OT):** El enfoque popularizado por Google Docs y Overleaf. Exige un servidor central con un reloj global para transformar y reordenar operaciones concurrentes.
2. **Tipos de Datos Replicados Libres de Conflicto (CRDT):** Enfoque distribuido y autónomo donde cada nodo puede emitir y aplicar operaciones locales de inmediato; la convergencia matemática final está garantizada al intercambiar estados o deltas sin necesidad de un árbitro central.

## Decisión
Se decide adoptar el paradigma **Local-First** respaldado por estructuras **CRDT** (específicamente algoritmos basados en secuencias tipo Yata / Fugue para texto y árboles CRDT para la jerarquía de bloques).

### Justificación:
* **Independencia de Servidores Centrales:** Permite sincronización directa Peer-to-Peer (P2P).
* **Latencia Cero en Operaciones Locales:** El usuario nunca experimenta demoras de red al teclear o estructurar su documento.
* **Tolerancia a Desconexiones Prolongadas:** Un usuario puede desconectarse por días o semanas en su laptop y al reconectar sus cambios se integran matemáticamente sin sobreescrituras destructivas.

## Consecuencias

### Positivas:
* Cumplimiento estricto del requisito de funcionamiento 100% offline (**RNF-02** y **RNF-09**).
* Cero costos de infraestructura central de bases de datos para el almacenamiento de documentos.
* Privacidad y soberanía de datos absoluta para el usuario.

### Negativas / Desafíos:
* Mayor complejidad teórica en el motor de sincronización.
* Consumo de memoria asociado al historial o metadatos de las operaciones CRDT (se mitigará mediante compactación periódica de snapshots y recolección de basura).
