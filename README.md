# MindLinkQuest - Discord Bot & Trade Tracker

Una aplicación web integrada con Discord que permite a los usuarios hacer login mediante códigos de acceso, ver perfiles públicos y compartir trade recaps.

## 🚀 Instalación Rápida con build.sh

Este proyecto incluye un script automatizado que instala **TODO** desde cero:

```bash
./build.sh
```

Este script:
1. ✅ Verifica Node.js y npm
2. ✅ Instala **TODAS** las dependencias automáticamente
3. ✅ Configura la base de datos (ejecuta `npm run db:push`)
4. ✅ Verifica variables de entorno
5. ✅ Está listo para producción (Render, Railway, etc.)

### Opciones del script

```bash
# Instalación normal
./build.sh

# Instalación limpia (borra node_modules primero)
./build.sh --clean

# Auto-inicio en producción (para Render)
AUTO_START=true ./build.sh
```

## 📋 Variables de Entorno Requeridas

Crea un archivo `.env` o configúralas en tu plataforma de hosting:

```bash
# Base de datos (REQUERIDA)
DATABASE_URL=postgresql://user:password@host:port/database

# Discord Bot (REQUERIDA para funcionalidad del bot)
DISCORD_BOT_TOKEN=tu_token_del_bot
DISCORD_CLIENT_ID=tu_client_id
DISCORD_GUILD_ID=tu_guild_id

# Sesiones (se genera automáticamente si no existe)
SESSION_SECRET=tu_secret_aleatorio_aqui

# Google AI (OPCIONAL - para features de IA)
GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_de_gemini
```

## 🔧 Desarrollo Local

### Método 1: Usando build.sh (Recomendado)
```bash
# Instalar todo desde cero
./build.sh

# Iniciar aplicación en desarrollo
npm run dev
```

### Método 2: Manual
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
npm run db:push

# 3. Iniciar aplicación
npm run dev
```

## 🌐 Deploy a Render (Producción)

### Paso 1: Preparar el Repositorio
1. Sube tu proyecto a GitHub
2. Asegúrate de que `build.sh` esté incluido

### Paso 2: Crear Web Service en Render
1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Haz click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `./build.sh`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Paso 3: Crear PostgreSQL Database
1. En Render, ve a "New +" → "PostgreSQL"
2. Copia la **Internal Database URL**
3. Agrégala como variable de entorno `DATABASE_URL` en tu Web Service

### Paso 4: Configurar Variables de Entorno
En el dashboard de Render, agrega:
```
DATABASE_URL=<tu_internal_database_url_de_render>
DISCORD_BOT_TOKEN=<tu_bot_token>
DISCORD_CLIENT_ID=<tu_client_id>
DISCORD_GUILD_ID=<tu_guild_id>
SESSION_SECRET=<genera_uno_aleatorio>
```

### Paso 5: Deploy
¡Haz click en "Create Web Service" y Render hará todo automáticamente!

El script `build.sh`:
- Instalará todas las dependencias
- Ejecutará `db:push` para configurar la base de datos
- Iniciará la aplicación automáticamente

## 📦 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar para producción
npm start            # Iniciar en producción
npm run db:push      # Actualizar schema de base de datos
npm run check        # Verificar tipos TypeScript
```

## 🎮 Comandos de Discord

- `/code` o `/generate-access` - Generar código de acceso para login web
- `/recap` - Subir un trade recap (con screenshot opcional)
- `/myrecaps` - Ver tus propios recaps
- `/recaps @usuario` - Ver recaps de otro usuario

## 🌟 Características

- ✅ **Login con Discord**: Códigos de acceso generados en Discord
- ✅ **Perfiles Públicos**: URLs amigables `/p/{username}`
- ✅ **Trade Recaps**: Sube y comparte tus trades con screenshots
- ✅ **Bot Inteligente**: Comandos slash interactivos
- ✅ **Base de datos PostgreSQL**: Con Drizzle ORM
- ✅ **Deploy Automático**: Script build.sh todo-en-uno

## 📁 Estructura del Proyecto

```
├── server/           # Backend (Express + TypeScript)
│   ├── index.ts     # Entry point
│   ├── bot.ts       # Discord bot
│   ├── db.ts        # Database config
│   └── routes.ts    # API routes
├── client/          # Frontend (HTML + CSS + JS)
│   ├── index.html   # Página principal
│   └── src/         # Estilos y scripts
├── shared/          # Código compartido
│   └── schema.ts    # Database schema
├── migrations/      # Migraciones de DB
├── build.sh         # 🔥 Script de instalación automática
└── package.json     # Dependencias
```

## 🛠️ Troubleshooting

### El script build.sh no ejecuta
```bash
# Hacerlo ejecutable
chmod +x build.sh
```

### Error de base de datos
```bash
# Verificar que DATABASE_URL esté configurada
echo $DATABASE_URL

# Forzar push del schema
npm run db:push
```

### Bot no conecta
- Verifica que `DISCORD_BOT_TOKEN` sea correcta
- Revisa que el bot tenga permisos en Discord Developer Portal
- Chequea los logs para errores de conexión

## 📝 Notas Importantes

- El script `build.sh` está diseñado para funcionar en cualquier entorno
- En Render, el script se ejecuta automáticamente con cada deploy
- Las variables de entorno deben configurarse en la plataforma de hosting
- El `SESSION_SECRET` se genera automáticamente si no existe

## 🚢 Desplegar a Otras Plataformas

El script `build.sh` funciona en cualquier plataforma que soporte Node.js:

- **Render**: Build Command = `./build.sh`, Start Command = `npm start`
- **Railway**: Build Command = `./build.sh`, Start Command = `npm start`
- **Heroku**: Usar Procfile con `web: npm start` y buildpack de Node.js
- **DigitalOcean**: Ejecutar `./build.sh` en el servidor y luego `npm start`

---

¿Preguntas o problemas? Revisa los logs de la aplicación y verifica que todas las variables de entorno estén configuradas correctamente.
