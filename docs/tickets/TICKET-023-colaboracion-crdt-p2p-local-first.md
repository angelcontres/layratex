# TICKET-023: Motor CRDT (Yjs) y Sincronización P2P en Red Local

- **Milestone:** Sprint 6 — Colaboración Local-First & Red P2P
- **Estado:** ⚪ Pendiente
- **Prioridad:** Bloqueante (P1)
- **Tipo:** P2P / Networking / Core

---

## 1. Descripción
Transformar la maqueta estática de la pestaña "P2P" en un sistema real de colaboración descentralizada (**Épica E7**, **HU-28 al HU-33**, **RNF-02**, **ADR-001**, **ADR-003**). Integrar un motor de tipo de datos replicados libres de conflicto (CRDT) con **Yjs** (`y-codemirror.next`) y transporte **WebRTC** directo entre dispositivos en red local mediante intercambio de clave/señalización o código QR.

## 2. Tareas Específicas
1. Instalar y configurar `yjs` y `y-codemirror.next` enlazados al estado de CodeMirror 6.
2. Implementar proveedor de señalización P2P sin servidor central externo:
   * Uso de WebRTC DataChannels para transmisión peer-to-peer de deltas de sincronización.
   * Generación y lectura de código QR en pantalla para intercambio inicial seguro (*pairing*).
3. Visualización de cursores remotos con avatares y nombres de usuario personalizados.
4. Detección de presencia en línea y latencia real (ping/pong en milisegundos) en la lista de dispositivos del enjambre.
5. Garantía de funcionamiento *Local-First*: el documento se guarda siempre en texto plano `.tex` en el disco local de cada máquina conectada.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Dos instancias de Layratex ejecutándose en la misma red local pueden sincronizar texto en tiempo real al enlazarse.
* [ ] Los cursores de los colaboradores remotos se muestran en colores diferenciados con su nombre.
* [ ] Si una máquina se desconecta o pierde red, puede continuar editando y al reconectarse las modificaciones convergen sin conflictos ni pérdida de datos.
