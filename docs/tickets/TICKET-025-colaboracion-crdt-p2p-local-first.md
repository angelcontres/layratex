# TICKET-025: Motor CRDT (Yjs) y Colaboración P2P Local-First con Cifrado E2EE

- **Milestone:** Sprint 6 — Colaboración Local-First & Red P2P (v1.0.0)
- **Estado:** ⚪ Pendiente
- **Prioridad:** Bloqueante (P1)
- **Tipo:** Core Architecture / Distributed P2P

---

## 1. Descripción
Implementar la infraestructura distribuida Local-First basada en tipos de datos replicados libres de conflictos (CRDT vía Yjs / Y-Rust) y canales de datos WebRTC / libp2p (**HU-30 al HU-32**, **RF-53 al RF-62**). Permitirá vincular múltiples dispositivos del usuario mediante código QR y sincronizar documentos bidireccionalmente sin intermediación de servidores centrales ni almacenamiento en la nube.

## 2. Tareas Específicas
1. Generación de identidad criptográfica por dispositivo (claves Ed25519 y Device ID único).
2. Emparejamiento por código QR efímero y canal SAS (*Short Authentication String*).
3. Integración de Y-Text vinculado al documento activo (sincronización delta incremental).
4. Canal WebRTC DataChannel directo cifrado de extremo a extremo con Noise Protocol / ChaCha20-Poly1305.
5. Presencia en vivo: visualización de cursores remotos con colores e identificadores de colaboradores.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Dos dispositivos en la misma red local pueden emparejarse escaneando un código QR sin crear cuentas de usuario.
* [ ] Las ediciones simultáneas en ambos dispositivos convergen sin producir conflictos ni duplicar archivos.
* [ ] El sistema continúa funcionando completamente offline cuando no hay conectividad.
