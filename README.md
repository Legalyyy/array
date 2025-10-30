# Discord Trading Bot 🤖

Bot de Discord con IA para comunidad de trading, con sistema de recaps, solicitudes de acceso y conversaciones inteligentes.

## 🚀 Inicialización Rápida

### Opción 1: Script de Inicialización Automática
```bash
./init-bot.sh
```

Este script:
- ✅ Verifica las variables de entorno necesarias
- 📦 Instala todas las dependencias
- 🗄️ Crea las tablas de la base de datos automáticamente
- 🚀 Inicia el bot

### Opción 2: Manual

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Asegúrate de tener estas variables en tu entorno:
- `DISCORD_TOKEN` - Token del bot de Discord
- `GEMINI_API_KEY` - API key de Google Gemini
- `DATABASE_URL` - URL de conexión a PostgreSQL

3. **Inicializar base de datos:**
```bash
npm run db:push
```

4. **Iniciar el bot:**
```bash
npm run dev
```

## 📋 Variables de Entorno Requeridas

| Variable | Descripción | Cómo obtenerla |
|----------|-------------|----------------|
| `DISCORD_TOKEN` | Token del bot de Discord | [Discord Developer Portal](https://discord.com/developers/applications) → Tu app → Bot → Reset Token |
| `GEMINI_API_KEY` | API key de Google Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `DATABASE_URL` | Conexión a PostgreSQL | Se configura automáticamente en Replit, o usa Neon/Supabase |

## 🎯 Funcionalidades

### Comandos Slash (/)
- `/help` - Muestra todos los comandos disponibles
- `/recap` - Graba un trade con P&L y notas
- `/myrecaps` - Ver tus recaps de trading
- `/recaps @usuario` - Ver recaps de otro usuario
- `/access` - Solicitar acceso a contenido exclusivo
- `/embed` - Crear un embed personalizado (Solo Admin)

### Conversaciones con IA
- **Menciona al bot** (`@BotName`) para hablar con él
- **Responde a sus mensajes** para continuar una conversación
- El bot aprende del contexto y recuerda conversaciones previas

### Comandos de Admin (Solo para el owner)
Habla naturalmente con el bot mencionándolo:
- "Borra 50 mensajes" - Elimina mensajes del canal
- "Elimina este canal" - Borra el canal actual (requiere confirmación)
- "Create a channel called general" - Crea un nuevo canal
- "Create a role called Trader" - Crea un nuevo rol

## 🗄️ Base de Datos

El bot utiliza PostgreSQL con las siguientes tablas:

- **conversations** - Historial de conversaciones para aprendizaje
- **trade_recaps** - Recaps de trading de usuarios
- **access_requests** - Solicitudes de acceso a contenido exclusivo
- **bot_knowledge** - Base de conocimiento personalizable

## 🔧 Scripts Disponibles

```bash
npm run dev       # Inicia el bot en modo desarrollo
npm run build     # Compila el proyecto para producción
npm start         # Inicia el bot en producción
npm run db:push   # Sincroniza schema con la base de datos
npm run check     # Verifica TypeScript
```

## 📦 Deployment en Render/Railway/etc

1. Conecta tu repositorio Git
2. Configura las variables de entorno (DISCORD_TOKEN, GEMINI_API_KEY, DATABASE_URL)
3. El script `init-bot.sh` se ejecutará automáticamente
4. O configura el comando de inicio: `npm start`

## 🛠️ Desarrollo

### Estructura del Proyecto
```
.
├── server/
│   ├── bot.ts        # Lógica principal del bot Discord
│   ├── gemini.ts     # Integración con Gemini AI
│   ├── storage.ts    # Capa de acceso a datos
│   ├── db.ts         # Configuración de base de datos
│   └── index.ts      # Servidor Express + inicialización
├── shared/
│   └── schema.ts     # Esquemas de base de datos (Drizzle)
├── init-bot.sh       # Script de inicialización automática
└── package.json
```

### Personalización

- **ID del Owner**: Edita `OWNER_ID` en `server/bot.ts` y `server/gemini.ts`
- **Personalidad del Bot**: Modifica `systemPrompt` en `server/gemini.ts`
- **Comandos**: Añade nuevos comandos en el array `commands` en `server/bot.ts`

## 🔒 Seguridad

- Nunca compartas tu `DISCORD_TOKEN` o `GEMINI_API_KEY`
- El bot solo responde a comandos de admin del owner configurado
- Las confirmaciones son requeridas para acciones destructivas

## 📝 Notas

- El bot usa Gemini 2.5 Flash para respuestas inteligentes
- Almacena todas las conversaciones para mejorar con el tiempo
- Soporta múltiples servidores simultáneamente
- Incluye sistema de confirmación para acciones peligrosas

## 🆘 Soporte

Si tienes problemas:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs del bot en la consola
3. Asegúrate de que el bot tenga los permisos necesarios en Discord

## 📄 Licencia

MIT
