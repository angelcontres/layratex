# ADR-002: Capa de Transporte P2P con Travesía NAT y WebRTC / libp2p

## Estado
**Aceptado** (2026-10-19)

## Contexto
El usuario necesita que sus dispositivos se sincronicen tanto en una red local (LAN de su casa u oficina) como a través de Internet (ej. laptop conectada a red móvil y PC de escritorio en casa). 

La inmensa mayoría de conexiones residenciales y móviles se encuentran detrás de **NAT (Network Address Translation)** y cortafuegos dinámicos que impiden la apertura de puertos entrantes directos estándar (TCP o UDP simple).

Se evaluaron tres opciones:
1. **Servidor Relay Centralizado Obligatorio:** Todo el tráfico viaja siempre por un servidor en la nube.
2. **Conexiones directas TCP/UDP con apertura manual de puertos (Port Forwarding / UPnP):** Fricción inaceptable para el usuario común.
3. **Pila P2P moderna con ICE / STUN / TURN (WebRTC DataChannels o libp2p):** Detección automática de candidatos locales, UDP hole punching reflexivo y fallback a TURN relay Zero-Knowledge si ambos NAT son simétricos estrictos.

## Decisión
Se decide implementar una **Capa de Transporte Híbrida P2P** basada en el protocolo ICE (STUN/TURN) y canales de datos cifrados (modelo WebRTC DataChannels / libp2p):
* Descubrimiento local instantáneo por **mDNS / Broadcast UDP**.
* Descubrimiento remoto vía servidor de señalización liviano y efímero (WebSocket / DHT Rendezvous) que solo intercambia ofertas/respuestas SDP.
* Cifrado de transporte de extremo a extremo sin acceso en texto plano para los relays intermedios.

## Consecuencias

### Positivas:
* Conexión directa y rápida en más del 85-90% de los escenarios domésticos y de oficina sin configuración manual.
* En redes locales, la sincronización es a velocidad gigabit sin tocar Internet ni consumir datos móviles.
* Mantenimiento de servidores externos mínimo y de costo casi nulo (sólo señalización ligera de texto y relay TURN para casos extremos).

### Negativas / Desafíos:
* Requiere mantener un servidor TURN público (o autoalojable) para permitir la conexión en redes corporativas con NATs simétricos estrictos.
