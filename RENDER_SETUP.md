# Guía de Deploy a Render - MindLinkQuest

Esta guía te ayudará a desplegar MindLinkQuest en Render paso a paso.

## 🚀 Configuración en Render

### 1. Crear PostgreSQL Database (PRIMERO)

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `mindlinkquest-db`
   - **Database**: `mindlinkquest`
   - **User**: (automático)
   - **Region**: Elige el más cercano a tus usuarios
   - **PostgreSQL Version**: 16 (recomendado)
   - **Plan**: Free (o el que prefieras)
4. Click en **"Create Database"**
5. **COPIA** la **Internal Database URL** (la necesitarás en el siguiente paso)

### 2. Crear Web Service

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura el servicio:

   **General:**
   - **Name**: `mindlinkquest`
   - **Region**: El mismo que tu base de datos
   - **Branch**: `main` (o tu branch principal)
   - **Root Directory**: (dejar vacío)

   **Build & Deploy:**
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     chmod +x build.sh && ./build.sh
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```

   **Instance Type:**
   - Free (o el que prefieras)

### 3. Configurar Variables de Entorno

En la sección **Environment** de tu Web Service, agrega estas variables:

#### Variables REQUERIDAS:

```bash
# Base de datos (copia la Internal Database URL de tu PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# Discord Bot (obtén estos valores del Discord Developer Portal)
DISCORD_BOT_TOKEN=tu_token_del_bot_aqui
DISCORD_CLIENT_ID=tu_application_id_aqui  
DISCORD_GUILD_ID=tu_server_id_aqui

# Seguridad (genera uno aleatorio con: openssl rand -base64 32)
SESSION_SECRET=tu_secret_aleatorio_largo_y_seguro

# Producción (importante para que Render compile correctamente)
NODE_ENV=production
```

#### Variables OPCIONALES:

```bash
# Google Gemini AI (para features de IA)
GOOGLE_GENERATIVE_AI_API_KEY=tu_gemini_key_aqui
```

### 4. Desplegar

1. Click en **"Create Web Service"**
2. Render automáticamente:
   - ✅ Clonará tu repositorio
   - ✅ Ejecutará `build.sh` (instala dependencias, compila app, configura DB)
   - ✅ Iniciará tu aplicación con `npm start`

### 5. Configurar Discord Bot Redirect URL

Una vez que tu aplicación esté desplegada:

1. Ve al [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a **OAuth2** → **General**
4. En **Redirects**, agrega:
   ```
   https://tu-app-name.onrender.com/api/auth/callback
   ```
5. Guarda los cambios

## ✅ Verificación Post-Deploy

Después del deploy, verifica que todo funcione:

1. **Verifica la URL**: Visita `https://tu-app-name.onrender.com`
2. **Chequea logs**: En Render dashboard → tu servicio → Logs
3. **Prueba el bot**: Ve a tu servidor de Discord
   - El bot debería estar online
   - Prueba `/generate-access` para generar un código
4. **Prueba login web**: Usa el código generado para hacer login

## 🐛 Solución de Problemas Comunes

### Error: "ENOENT: no such file or directory, stat '/opt/render/project/src/dist/client/index.html'"

**Causa**: El build no se ejecutó correctamente o los archivos no se compilaron.

**Solución**:
1. Verifica que el **Build Command** sea exactamente: `chmod +x build.sh && ./build.sh`
2. Verifica los logs de build en Render
3. Asegúrate de que `NODE_ENV=production` esté en las variables de entorno
4. Haz un re-deploy manual

### El bot no aparece online en Discord

**Soluciones**:
1. Verifica que `DISCORD_BOT_TOKEN` sea correcto (sin espacios)
2. Verifica que el bot tenga permisos en Discord Developer Portal:
   - Bot → Privileged Gateway Intents → SERVER MEMBERS INTENT ✓
   - Bot → Privileged Gateway Intents → MESSAGE CONTENT INTENT ✓
3. Verifica los logs en Render para errores del bot

### Error de conexión a la base de datos

**Soluciones**:
1. Copia la **Internal Database URL** (no la External)
2. Verifica que el formato sea: `postgresql://user:password@host/database`
3. Asegúrate de que la base de datos esté en la misma región que el Web Service

### El build tarda mucho o falla

**Soluciones**:
1. Verifica que tienes suficiente memoria en tu plan de Render
2. Chequea los logs de build para ver dónde falla
3. Si falla en `npm install`, puede ser un problema temporal - intenta re-deploy

### Los comandos slash de Discord no aparecen

**Soluciones**:
1. Los comandos se registran automáticamente cuando el bot inicia
2. Espera 1-2 minutos después del deploy
3. Si no aparecen, verifica los logs para errores
4. Intenta escribir `/` en Discord y busca tu bot en la lista

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# En Render Dashboard
Tu servicio → Logs
```

### Métricas
```bash
# En Render Dashboard  
Tu servicio → Metrics
```

### Database
```bash
# En Render Dashboard
Tu PostgreSQL → Info
```

## 🔄 Actualizaciones

Para actualizar tu aplicación:

1. **Push a GitHub**: Haz push de tus cambios a tu repositorio
2. **Auto-deploy**: Render detectará los cambios y desplegará automáticamente
3. **Manual deploy**: O ve a Render → tu servicio → Manual Deploy

## 🔐 Seguridad

### Mejores Prácticas:

1. **Nunca** compartas tu `DISCORD_BOT_TOKEN` públicamente
2. **Nunca** commitas `.env` a Git
3. **Rota** tu `SESSION_SECRET` periódicamente
4. **Usa** la Internal Database URL (no la External)
5. **Habilita** HTTPS (Render lo hace automáticamente)

## 💡 Tips Adicionales

- **Free Tier**: Los servicios gratuitos de Render se duermen después de 15 minutos de inactividad
- **Primer Request**: Puede tardar 30-60 segundos en despertar
- **Upgrades**: Considera upgradar a un plan pago para evitar el sleep
- **Custom Domain**: Puedes agregar tu propio dominio en Settings → Custom Domain

---

¿Problemas? Revisa los logs primero. La mayoría de errores se pueden diagnosticar desde ahí.
