# SDD 02 — Arquitectura del Sistema (Modelo C4)

Este documento detalla las vistas arquitectónicas de Layratex utilizando el modelo **C4 (Contexto, Contenedores y Componentes)**.

---

## 2.1 Nivel 1: Diagrama de Contexto del Sistema

Describe cómo interactúa el usuario y sus dispositivos con el entorno y servicios externos.

```mermaid
flowchart TD
    User["Usuario / Redactor Técnico"]
    
    subgraph Swarm["Red P2P Privada del Usuario"]
        DeviceA["Dispositivo A (Laptop)\n[Instancia Layratex]"]
        DeviceB["Dispositivo B (Desktop)\n[Instancia Layratex]"]
    end
    
    PeerCollaborator["Colaborador Externo\n[Instancia Layratex]"]
    
    subgraph InfraAuxiliar["Infraestructura Auxiliar Ligera (Zero-Knowledge)"]
        Signaling["Servidor de Señalización / Discovery\n(WebRTC / libp2p Rendezvous)"]
        Relay["Servidor STUN / TURN\n(Travesía NAT si falla P2P directo)"]
    end
    
    GitRemote["Servicios Git Remotos\n(GitHub / GitLab)\n[Opcional]"]

    User -->|"Edita localmente"| DeviceA
    User -->|"Edita localmente"| DeviceB
    
    DeviceA <-->|"Sincronización P2P Cifrada E2EE"| DeviceB
    DeviceA <-->|"Colaboración P2P Cifrada"| PeerCollaborator
    
    DeviceA -.->|"Handshake inicial / ICE"| Signaling
    DeviceB -.->|"Handshake inicial / ICE"| Signaling
    DeviceA -.->|"Fallback relay si NAT estricto"| Relay
    DeviceB -.->|"Fallback relay si NAT estricto"| Relay
    
    DeviceA -.->|"Push / Pull opcional"| GitRemote
```

---

## 2.2 Nivel 2: Diagrama de Contenedores

Detalla los principales subsistemas que conforman la aplicación de escritorio en cada nodo cliente.

```mermaid
flowchart TD
    subgraph AppDispositivo["Instancia de Escritorio Layratex (Peer)"]
        UI["Capa de Presentación / UI\n(Editor Híbrido: Código, Visual, Preview)"]
        
        DocEngine["Motor de Documento & Transpilador\n(AST LaTeX, Parser Bidireccional)"]
        
        SyncEngine["Motor de Sincronización CRDT\n(Gestor de Estado, Operaciones, Historial)"]
        
        LaTeXRuntime["Runtime de Compilación LaTeX\n(Compilador Incremental, PDF Engine, Diagnóstico)"]
        
        CryptoIdentity["Gestor de Criptografía e Identidad\n(Llavero Ed25519, Noise Protocol, ACL)"]
        
        P2PTransport["Subsistema de Transporte P2P\n(libp2p / WebRTC DataChannels, NAT Traversal)"]
        
        LocalStorage["Almacenamiento Local Seguro\n(Archivos .tex, Base de datos local de snapshots/deltas)"]
    end

    UI <--> DocEngine
    UI <--> SyncEngine
    UI --> LaTeXRuntime
    
    DocEngine <--> SyncEngine
    SyncEngine <--> LocalStorage
    SyncEngine <--> P2PTransport
    
    P2PTransport <--> CryptoIdentity
    LaTeXRuntime --> LocalStorage
```

---

## 2.3 Nivel 3: Diagrama de Componentes (Motor de Sincronización y Red)

Profundiza en la interacción entre la edición del usuario, la generación de deltas CRDT y el transporte de red.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant UI as Editor UI
    participant Doc as Document Model (CRDT)
    participant Store as Local Persistence
    participant Net as P2P Network Worker
    participant Peer as Peer Remoto (Dispositivo B)

    U->>UI: Escribe texto o modifica bloque visual
    UI->>Doc: Aplica mutación local
    Doc->>Doc: Genera Delta de operación CRDT
    Doc->>UI: Actualiza vista reactiva (0 ms)
    Doc->>Store: Guarda delta en base de datos local
    Doc->>Net: Emite mensaje de sincronización cifrado
    Net->>Peer: Envía delta por canal P2P directo (E2EE)
    Peer->>Peer: Integra delta en su CRDT local
    Peer->>Peer: Convergencia matemática automática garantizada
```

---

## 2.4 Resumen de Responsabilidades por Contenedor

1. **Capa de Presentación (UI):** Renderiza el editor dividido (Modo Código, Modo Visual WYSIWYM y Modo Vista Previa PDF/Canvas). Despacha eventos de usuario sin esperas asíncronas.
2. **Motor de Sincronización CRDT:** Mantiene la verdad canónica del documento en memoria y disco, resolviendo divergencias sin pérdida de información.
3. **Subsistema de Transporte P2P:** Administra sockets de datos cifrados, descubrimiento de pares en LAN e Internet, y travesía de cortafuegos (NAT Traversal).
4. **Runtime de Compilación LaTeX:** Coordina la compilación local y generación rápida de vistas previas incrementales sin bloquear el hilo principal.
5. **Criptografía e Identidad:** Protege las llaves del usuario, valida firmas de mutaciones entrantes y orquesta el emparejamiento por QR.
