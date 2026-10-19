# ADR-004: Selección del Stack Tecnológico del Cliente de Escritorio y Core P2P

## Estado
**Aceptado** (2026-10-19)

## Contexto
Layratex requiere un entorno de ejecución multiplataforma (Linux, Windows, macOS) que soporte:
1. Operaciones nativas de bajo nivel: sockets de red P2P (UDP/TCP/QUIC), criptografía de alta velocidad (Ed25519/ChaCha20), procesos hijos en segundo plano para compilación LaTeX y acceso a sistema de archivos.
2. Interfaz gráfica moderna, reactiva, con soporte para editores de código profesionales (resaltado de sintaxis, autocompletado, minimapa) y renderizado de fórmulas matemáticas vectoriales en tiempo real.
3. Huella de memoria mínima y consumo eficiente de batería en laptops.

Se evaluaron tres alternativas principales:
* **Alternativa A: Electron (Chromium + Node.js)**
* **Alternativa B: Tauri 2.0 (Rust Core + Webview Nativo del SO + TypeScript)**
* **Alternativa C: Flutter (Dart + FFI a librerías nativas en C/C++)**

## Decisión
Se decide adoptar **Tauri 2.0 (Rust) + TypeScript / React (o Svelte) + CodeMirror 6 + Yjs / Automerge**:

```
┌────────────────────────────────────────────────────────┐
│ UI Layer (Webview Nativo: WebKitGTK / WebView2)        │
│ • CodeMirror 6 (Editor LaTeX de alto rendimiento)      │
│ • KaTeX / MathJax (Renderizado incremental de fórmulas)│
│ • TailwindCSS + Shadcn/Radix (Componentes visuales)    │
└───────────────────────────▲────────────────────────────┘
                            │ IPC Seguro Bidireccional
┌───────────────────────────▼────────────────────────────┐
│ Core Nativo (Rust 2024 / Tauri Core)                   │
│ • libp2p / WebRTC (Sockets P2P, ICE/STUN/TURN)         │
│ • ed25519-dalek & chacha20poly1305 (Criptografía)      │
│ • SQLite (WAL mode) / Almacenamiento local de deltas   │
│ • Orquestador de procesos Tectonic / pdflatex          │
└────────────────────────────────────────────────────────┘
```

### Justificación:
1. **Rendimiento y Consumo de Recursos:** Rust ofrece velocidad cercana al metal y cero recolección de basura (*Garbage Collection pauses*), garantizando que la sincronización P2P en segundo plano no cause tirones ni consuma memoria excesiva (< 80 MB de RAM base frente a > 400 MB de Electron).
2. **Ecosistema P2P Robusto:** El ecosistema de Rust cuenta con `libp2p-rs` y stacks de WebRTC maduros y utilizados en producción a gran escala.
3. **Editor de Código Profesional:** La capa webview permite integrar `CodeMirror 6`, el motor de edición modular más ligero y extensible del mercado, perfectamente compatible con binding de CRDTs (Yjs / Y-Codemirror).
4. **Empaquetado Liviano:** Los instaladores generados pesan típicamente entre 10 MB y 25 MB (frente a los > 150 MB de un instalador Electron).

## Consecuencias

### Positivas:
* Cumplimiento estricto de **RNF-01** (multiplataforma) y **RNF-04** (latencia < 200 ms).
* Binarios ultracompactos y arranque casi instantáneo.
* Seguridad de memoria garantizada por Rust en toda la superficie de red P2P expuesta a Internet.

### Negativas / Mitigaciones:
* Curva de aprendizaje más pronunciada en la integración IPC Rust-TypeScript (se mitiga con la generación automática de comandos y tipos tipados de Tauri).
