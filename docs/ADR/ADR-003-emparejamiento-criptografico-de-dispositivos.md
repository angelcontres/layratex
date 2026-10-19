# ADR-003: Emparejamiento Descentralizado de Dispositivos mediante Códigos QR y Noise Protocol

## Estado
**Aceptado** (2026-10-19)

## Contexto
Para sincronizar dos dispositivos de un usuario (ej. Laptop y PC de escritorio), los sistemas tradicionales exigen crear una cuenta centralizada (email + contraseña o login con Google/GitHub). 

En el paradigma de Layratex, el objetivo es maximizar la soberanía del usuario, evitar la recolección innecesaria de datos personales y eliminar puntos únicos de compromiso (brechas de seguridad de bases de datos de contraseñas).

Se requiere un mecanismo de emparejamiento entre dispositivos que sea:
1. Extremadamente sencillo para el usuario (experiencia tipo WhatsApp Web o emparejamiento de billeteras Web3 / Signal).
2. Altamente seguro contra ataques de intermediario (Man-in-the-Middle - MITM).
3. 100% descentralizado y criptográfico.

## Decisión
Se decide adoptar un modelo de **Identidad Soberana por Dispositivo** y **Emparejamiento Criptográfico Directo**:
1. **Identidad:** Cada dispositivo genera un par de claves `Ed25519` en su primer inicio.
2. **Canal de Intercambio Out-of-Band (Código QR / Enlace Temporal):**
   * El dispositivo principal genera un token de emparejamiento de un solo uso con alta entropía (`SecretPairingToken`) y lo expone en un código QR junto a su clave pública e IP/Multiaddr.
   * El dispositivo secundario escanea el QR con la cámara web o ingresa la clave de texto seguro.
3. **Validación Mutua (SAS - Short Authentication String):**
   * Tras conectarse, ambos dispositivos muestran una secuencia corta de confirmación (4 dígitos o 3 emojis derivados del hash de la sesión) para que el usuario verifique visualmente que no hay intermediarios antes de consolidar la relación de confianza.
4. **Almacén de Confianza Local (Trust Store):**
   * Una vez aceptado, la clave pública del nuevo dispositivo se guarda en el almacén local del dispositivo emisor y viceversa. A partir de ese momento, la sincronización es automática e inadvertida.

## Consecuencias

### Positivas:
* Cero necesidad de bases de datos de usuarios o servidores de autenticación centralizados.
* Excelente experiencia de usuario (un escaneo QR o copy-paste de token basta).
* Resistencia demostrada contra espionaje y ataques de intermediario.

### Negativas / Desafíos:
* Si el usuario pierde todos sus dispositivos a la vez sin haber respaldado su clave maestra o carpeta local, no hay un "soporte técnico central" que pueda recuperar los datos (se mitiga ofreciendo exportación de clave de respaldo/frase mnemónica de 12 palabras o integración con Git).
