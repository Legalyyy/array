# Configuración de Permisos del Bot de Discord

## ⚠️ PROBLEMA: Error "Missing Permissions" (50013)

Este error ocurre cuando el bot no tiene los permisos necesarios en Discord. Aquí está cómo arreglarlo:

## 1. Permisos Necesarios en Discord Developer Portal

Ve a [Discord Developer Portal](https://discord.com/developers/applications) y selecciona tu aplicación:

### Bot Permissions (en la sección "Bot"):
Activa los siguientes permisos:

**General Permissions:**
- [x] Administrator (Recomendado para funcionalidad completa)

**O si prefieres permisos específicos:**

**Text Permissions:**
- [x] Send Messages
- [x] Send Messages in Threads
- [x] Create Public Threads
- [x] Create Private Threads
- [x] Embed Links
- [x] Attach Files
- [x] Add Reactions
- [x] Use External Emojis
- [x] Use External Stickers
- [x] Mention @everyone, @here, and All Roles
- [x] Manage Messages (para eliminar mensajes)
- [x] Manage Threads
- [x] Read Message History
- [x] Use Slash Commands

**Voice Permissions:**
- [x] Connect
- [x] Speak
- [x] Mute Members
- [x] Deafen Members
- [x] Move Members
- [x] Use Voice Activity

**Membership Permissions:**
- [x] Kick Members
- [x] Ban Members
- [x] Manage Nicknames
- [x] Moderate Members (para timeout)

**Channel Management:**
- [x] Manage Channels
- [x] Manage Roles
- [x] Manage Webhooks
- [x] View Channels

**Server Management:**
- [x] Manage Server
- [x] Create Expressions
- [x] View Audit Log

## 2. Jerarquía de Roles en el Servidor

**MUY IMPORTANTE:** El rol del bot debe estar **MÁS ALTO** que los roles de los usuarios que quieres moderar.

### Cómo ajustar:
1. Ve a tu servidor de Discord
2. Configuración del Servidor → Roles
3. Arrastra el rol del bot ARRIBA (más alto que otros roles)
4. El bot solo puede moderar usuarios con roles DEBAJO del suyo

## 3. Permisos de Intents

En Discord Developer Portal → Bot → Privileged Gateway Intents:

- [x] **PRESENCE INTENT**
- [x] **SERVER MEMBERS INTENT** ✅ CRÍTICO
- [x] **MESSAGE CONTENT INTENT** ✅ CRÍTICO

Sin estos, el bot **NO FUNCIONARÁ**.

## 4. Re-invitar el Bot con Permisos Correctos

Usa este link para re-invitar tu bot (reemplaza CLIENT_ID con tu Client ID):

```
https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

El `permissions=8` le da permisos de **Administrator**.

### Si quieres permisos específicos:
Usa el [Discord Permissions Calculator](https://discordapi.com/permissions.html) para generar el número correcto.

## 5. Verificar Permisos del Bot

Después de estos pasos, verifica que el bot tenga permisos ejecutando en Discord:

```
@bot_mention list roles
```

Debería responder con la lista de roles del servidor.

## 6. Troubleshooting Común

### "Missing Permissions" al kickear/banear:
- ✅ Verifica que el rol del bot esté MÁS ALTO que el usuario objetivo
- ✅ Verifica que el bot tenga "Kick Members" y "Ban Members" activados

### "Missing Permissions" al modificar roles:
- ✅ Verifica que el rol del bot esté MÁS ALTO que el rol que intentas asignar
- ✅ Verifica que el bot tenga "Manage Roles" activado

### "Missing Permissions" al modificar canales:
- ✅ Verifica que el bot tenga "Manage Channels" activado
- ✅ Verifica permisos específicos del canal (puede estar bloqueado)

## 7. Código del Bot - Mejor Manejo de Errores

El bot ahora incluye mejor manejo de errores que te dirá EXACTAMENTE qué permiso falta.

## URLs Útiles

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Permissions Calculator](https://discordapi.com/permissions.html)
- [Discord.js Guide](https://discordjs.guide/)

---

**NOTA IMPORTANTE:** Después de hacer estos cambios, es posible que necesites expulsar y re-invitar el bot al servidor.
