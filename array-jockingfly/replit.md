# Discord Trading Bot - HobbyStream

## 🤖 Descripción del Proyecto

Bot de Discord con inteligencia artificial para una comunidad de trading. El bot utiliza Gemini AI para conversaciones naturales, almacena recaps de trading, maneja solicitudes de acceso y responde a comandos administrativos.

## ✅ Estado Actual: 100% Funcional

- ✅ Bot conectado a Discord
- ✅ Comandos slash registrados
- ✅ Base de datos PostgreSQL inicializada
- ✅ Integración con Gemini AI funcionando
- ✅ Sistema de respuestas a menciones y replies
- ✅ Comandos administrativos activos

## 🎯 Funcionalidades Principales

### 1. Conversaciones con IA
- Menciona al bot (`@array`) o responde a sus mensajes
- El bot mantiene contexto de conversaciones previas
- Personalidad configurada para comunidad de trading
- Aprende de cada interacción

### 2. Comandos Slash
- `/help` - Lista todos los comandos
- `/recap` - Registrar un trade con P&L y notas
- `/myrecaps` - Ver tus propios recaps
- `/recaps @usuario` - Ver recaps de otro usuario
- `/access` - Solicitar acceso a contenido exclusivo
- `/embed` - Crear embeds personalizados (Admin)

### 3. Comandos Administrativos (Chat Natural)
Solo el owner puede usar estos comandos mencionando al bot:
- "Borra 50 mensajes" - Elimina mensajes
- "Elimina este canal" - Borra canal (con confirmación)
- "Create a channel called general" - Crea canal
- "Create a role called Trader" - Crea rol

## 🗄️ Base de Datos

### Tablas Configuradas:
1. **conversations** - Historial de conversaciones
2. **trade_recaps** - Recaps de trading de usuarios
3. **access_requests** - Solicitudes de acceso
4. **bot_knowledge** - Base de conocimiento personalizable

## 🚀 Inicialización

### En Replit
El bot ya está corriendo. Simplemente revisa que:
1. Variables de entorno estén configuradas (DISCORD_TOKEN, GEMINI_API_KEY, DATABASE_URL)
2. El workflow "Start application" esté corriendo

### En Otro Entorno (Render, Railway, etc.)

**Opción 1: Script Automático**
```bash
./deploy.sh
```

**Opción 2: Manual**
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
export DISCORD_TOKEN="tu_token"
export GEMINI_API_KEY="tu_api_key"
export DATABASE_URL="postgresql://..."

# 3. Inicializar base de datos
npm run db:push

# 4. Iniciar bot
npm run dev  # Desarrollo
npm start    # Producción
```

## 📋 Variables de Entorno Necesarias

| Variable | Propósito | Dónde Obtenerla |
|----------|-----------|-----------------|
| DISCORD_TOKEN | Token del bot | [Discord Developer Portal](https://discord.com/developers/applications) |
| GEMINI_API_KEY | API de Gemini AI | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| DATABASE_URL | Conexión PostgreSQL | Provisto automáticamente en Replit |

## 🔧 Configuración del Bot en Discord

### Permisos Necesarios:
- Read Messages/View Channels
- Send Messages
- Manage Messages (para borrar mensajes)
- Manage Channels (para crear/eliminar canales)
- Manage Roles (para crear/eliminar roles)
- Use Slash Commands
- Embed Links
- Read Message History

### Intents Requeridos:
- Server Members Intent
- Message Content Intent
- Presence Intent (opcional)

## 📁 Estructura del Proyecto

```
.
├── server/
│   ├── bot.ts          # Lógica principal del bot Discord
│   ├── gemini.ts       # Integración con Gemini AI
│   ├── storage.ts      # Capa de acceso a datos
│   ├── db.ts          # Configuración de Drizzle ORM
│   └── index.ts       # Servidor Express + inicialización
├── shared/
│   └── schema.ts      # Esquemas de base de datos
├── init-bot.sh        # Script de inicialización para desarrollo
├── deploy.sh          # Script de deployment para producción
├── README.md          # Documentación completa
└── package.json       # Dependencias y scripts
```

## 🛠️ Scripts Disponibles

```bash
npm run dev       # Desarrollo con hot reload
npm run build     # Compilar para producción
npm start         # Iniciar en producción
npm run db:push   # Sincronizar schema con DB
npm run check     # Verificar TypeScript
```

## 🔒 Seguridad

- **Owner ID**: Configurado en `server/bot.ts` (404315406111604747)
- Solo el owner puede ejecutar comandos administrativos
- Confirmaciones requeridas para acciones destructivas
- Tokens almacenados en variables de entorno

## 📝 Personalización

### Cambiar Owner ID
Edita en `server/bot.ts` y `server/gemini.ts`:
```typescript
const OWNER_ID = "TU_DISCORD_USER_ID";
```

### Modificar Personalidad del Bot
Edita `systemPrompt` en `server/gemini.ts`

### Añadir Nuevos Comandos
Añade al array `commands` en `server/bot.ts`

## 🐛 Debugging

### Ver Logs en Tiempo Real
Los logs muestran cada mensaje recibido:
```
📨 Message from username: "mensaje"
   Bot mentioned: true/false
   Is reply to bot: true/false
   → Generating AI response...
   ✅ Reply sent successfully!
```

### Problemas Comunes

1. **Bot no responde a menciones**
   - Verifica que Message Content Intent esté activado
   - Revisa que el bot tenga permisos de lectura

2. **Comandos slash no aparecen**
   - Los comandos se registran al iniciar el bot
   - Espera 1-2 minutos después de iniciar

3. **Error de base de datos**
   - Ejecuta `npm run db:push -- --force`

## 📊 Estadísticas del Proyecto

- **Lenguaje**: TypeScript
- **Framework**: Discord.js v14
- **IA**: Google Gemini 2.5 Flash
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Servidor**: Express.js
- **Runtime**: Node.js 20

## 🎨 Características Únicas

1. **Aprendizaje Continuo**: Almacena todas las conversaciones
2. **Contexto Inteligente**: Usa historial de conversaciones
3. **Sistema de Confirmaciones**: Seguridad para acciones peligrosas
4. **Multi-servidor**: Soporta múltiples servidores simultáneamente
5. **Comandos Naturales**: Admin puede usar lenguaje natural

## 🚀 Deployment en Producción

### Render.com
1. Conecta tu repo Git
2. Build Command: `npm install && npm run db:push -- --force && npm run build`
3. Start Command: `npm start`
4. Configura variables de entorno

### Railway.app
1. Conecta tu repo Git
2. Railway detectará automáticamente Node.js
3. Configura variables de entorno
4. Start Command: `npm start`

### Fly.io
```bash
fly launch
fly secrets set DISCORD_TOKEN="..." GEMINI_API_KEY="..." DATABASE_URL="..."
fly deploy
```

## 📞 Contacto

Bot Owner: `<@404315406111604747>` en Discord

## 📜 Licencia

MIT License - Proyecto personal para comunidad de trading
