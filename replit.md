# MindLinkQuest - Discord Bot & Trade Tracker

## Descripción del Proyecto

MindLinkQuest es una aplicación web integrada con Discord que permite a los usuarios:
- Hacer login mediante códigos de acceso generados en Discord
- Ver perfiles públicos de usuarios con sus trade recaps
- Subir y compartir recaps de trades desde Discord con screenshots
- Navegar perfiles en formato `/p/{username}`

## Arquitectura

### Backend (Node.js + Express + TypeScript)
- **Server**: Express server en puerto 5000
- **Database**: PostgreSQL (Neon) con Drizzle ORM
- **Discord Bot**: Bot de Discord con comandos slash
- **API Routes**: RESTful API para perfiles y autenticación

### Frontend (HTML + CSS + JavaScript Vanilla)
- **Client-side routing**: Detecta rutas `/p/{username}` para mostrar perfiles
- **Animaciones**: GSAP y Lenis para animaciones suaves
- **Estilo**: CSS personalizado con diseño moderno

### Base de Datos
Tablas principales:
- `trade_recaps`: Trade recaps con screenshots
- `access_codes`: Códigos de acceso para login web
- `conversations`: Historial de conversaciones con el bot
- `bot_knowledge`: Knowledge base del bot
- `learned_facts`: Hechos aprendidos por el bot

## Cambios Realizados

### 1. Estructura del Proyecto
- ✅ Movidos todos los archivos de `MindLinkQuest/` a la raíz
- ✅ Instaladas dependencias necesarias (discord.js, express, etc.)

### 2. Base de Datos
- ✅ Creada base de datos PostgreSQL
- ✅ Ejecutadas migraciones con `npm run db:push`

### 3. Arreglo de Errores del Bot
**Problema**: Discord bot mostraba errores "Unknown interaction" y "Interaction has already been acknowledged"

**Solución**: Agregada validación para evitar responder dos veces a la misma interacción:
```javascript
if (!interaction.replied && !interaction.deferred) {
  try {
    await interaction.reply({ ... });
  } catch (replyError) {
    console.error("Failed to send error reply:", replyError);
  }
}
```

### 4. Arreglo del Routing de Perfiles
**Problema**: Las URLs `/p/{username}` no funcionaban para usernames con puntos (ej: `order.rejected`)

**Solución**: Actualizado el regex en `client/src/script.js`:
```javascript
// Antes:
const profileMatch = path.match(/^\/p\/([a-zA-Z0-9_-]+)$/);

// Después (incluye punto):
const profileMatch = path.match(/^\/p\/([a-zA-Z0-9._-]+)$/);
```

## Cómo Usar la Aplicación

### Para Usuarios (Discord)

1. **Generar código de acceso**:
   ```
   /code
   ```
   El bot te enviará un código en formato XXX-XXX

2. **Subir un trade recap**:
   ```
   /recap (opcionalmente adjunta screenshot)
   ```
   Completa el modal con P&L y notas

3. **Ver tus recaps**:
   ```
   /myrecaps
   ```

4. **Ver recaps de otro usuario**:
   ```
   /recaps @usuario
   ```

### Para Acceder a la Web

1. Abre la aplicación web en tu navegador
2. Haz scroll hasta la sección de login
3. Click en "LOG IN"
4. Ingresa el código que generaste con `/code` en Discord
5. Serás redirigido a tu perfil en `/p/{tu_username}`

### Para Ver Perfiles Públicos

Visita: `https://tu-app.replit.app/p/{username}`

Ejemplo: `https://tu-app.replit.app/p/order.rejected`

## Scripts Disponibles

```bash
# Desarrollo (inicia servidor con hot-reload)
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Push schema a la base de datos
npm run db:push

# Forzar push (si hay conflictos)
npm run db:push --force
```

## Variables de Entorno Requeridas

- `DATABASE_URL`: URL de conexión a PostgreSQL (auto-configurado)
- `SESSION_SECRET`: Secret para sesiones (auto-configurado)
- `DISCORD_TOKEN`: Token del bot de Discord (requerido para el bot)

## Estado Actual

✅ **Funcionando**:
- Servidor Express corriendo en puerto 5000
- Bot de Discord conectado y funcionando
- Base de datos con migraciones aplicadas
- API de perfiles funcional
- Routing a páginas de perfil arreglado
- Errores de interacciones de Discord corregidos

⚠️ **Nota**: Los errores de "Unknown interaction" ya no deberían aparecer. Si aparecen, significa que Discord tardó más de 3 segundos en recibir la respuesta (timeout de Discord API).

## Próximos Pasos Sugeridos

1. **Mejorar UX**: Agregar loading states en el frontend
2. **Paginación**: Para usuarios con muchos trades
3. **Filtros**: Filtrar trades por P&L positivo/negativo
4. **Stats**: Agregar estadísticas (win rate, average P&L, etc.)
5. **Dark mode**: Toggle entre modo claro/oscuro
6. **Mobile**: Mejorar responsive design para móviles

## Estructura de Archivos

```
├── server/
│   ├── index.ts          # Entry point del servidor
│   ├── bot.ts            # Discord bot con todos los comandos
│   ├── storage.ts        # Interface de storage con DB
│   ├── db.ts             # Configuración de Drizzle
│   └── routes.ts         # API routes (actualmente vacío)
├── client/
│   ├── index.html        # HTML principal con ambas páginas
│   └── src/
│       ├── script.js     # JavaScript con routing y lógica
│       └── style.css     # Estilos personalizados
├── shared/
│   └── schema.ts         # Drizzle schema (tipos compartidos)
└── package.json          # Dependencies y scripts
```

## Troubleshooting

### El bot no responde
- Verifica que `DISCORD_TOKEN` esté configurado correctamente
- Revisa los logs para errores de conexión

### La página de perfil no carga
- Verifica que el username existe en la base de datos
- Revisa la consola del navegador para errores
- Asegúrate que el API endpoint `/api/profile/{username}` devuelva datos

### Error "User not found"
- El usuario debe tener al menos 1 trade recap en la base de datos
- Usa `/recap` en Discord para crear un trade
