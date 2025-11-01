# 🚀 Guía de Deployment

Este documento explica cómo deployar el bot en diferentes plataformas.

## 📦 Deployment Rápido en Render

### Opción 1: Blueprint (Automático)

1. Haz fork/push de este repo a GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New +" → "Blueprint"
4. Conecta tu repositorio
5. Render detectará automáticamente `render.yaml`
6. Configura los secretos:
   - `DISCORD_TOKEN` - Tu token de Discord
   - `GEMINI_API_KEY` - Tu API key de Gemini
7. Click "Apply" - ¡El bot se desplegará automáticamente!

### Opción 2: Manual

1. Crea un nuevo "Web Service"
2. Conecta tu repositorio
3. Configuración:
   - **Build Command**: `npm install && npm run db:push -- --force && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Añade PostgreSQL Database:
   - Name: `discord-bot-db`
   - Plan: Free
5. Variables de entorno:
   - `DISCORD_TOKEN` - Tu token
   - `GEMINI_API_KEY` - Tu API key
   - `DATABASE_URL` - Se configura automáticamente cuando añades la DB
   - `NODE_ENV=production`
6. Deploy!

## 🚂 Railway.app

1. Instala [Railway CLI](https://docs.railway.app/develop/cli)
```bash
npm i -g @railway/cli
```

2. Login y crea proyecto
```bash
railway login
railway init
```

3. Añade PostgreSQL
```bash
railway add postgresql
```

4. Configura variables de entorno
```bash
railway variables set DISCORD_TOKEN="tu_token"
railway variables set GEMINI_API_KEY="tu_api_key"
```

5. Deploy
```bash
railway up
```

## ✈️ Fly.io

1. Instala [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)

2. Login
```bash
fly auth login
```

3. Crea app
```bash
fly launch --no-deploy
```

4. Añade PostgreSQL
```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

5. Configura secretos
```bash
fly secrets set DISCORD_TOKEN="tu_token"
fly secrets set GEMINI_API_KEY="tu_api_key"
```

6. Deploy
```bash
fly deploy
```

## 🐳 Docker

### Crear Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Build y Run
```bash
docker build -t discord-bot .
docker run -d \
  -e DISCORD_TOKEN="tu_token" \
  -e GEMINI_API_KEY="tu_api_key" \
  -e DATABASE_URL="postgresql://..." \
  discord-bot
```

## 🔧 Variables de Entorno Requeridas

Todas las plataformas necesitan estas variables:

| Variable | Descripción | Cómo obtenerla |
|----------|-------------|----------------|
| `DISCORD_TOKEN` | Token del bot | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token |
| `GEMINI_API_KEY` | API key de Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `DATABASE_URL` | PostgreSQL connection string | Provista por la plataforma o usa [Neon](https://neon.tech) |
| `NODE_ENV` | Entorno (production) | Setea a `production` |

## 📊 Monitoreo

### Health Check Endpoint
```
GET /api/health
```

Responde con:
```json
{
  "status": "ok",
  "message": "Discord bot is running"
}
```

### Logs
Todos los servicios proveen logs. Busca:
```
✅ Discord bot logged in as <bot-name>
✅ Slash commands registered
```

## 🔄 CI/CD con GitHub Actions

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys \
            -H "Authorization: Bearer $RENDER_API_KEY"
```

## 🆘 Troubleshooting

### Bot no se conecta
- Verifica que `DISCORD_TOKEN` esté correctamente configurado
- Revisa los logs para ver errores de autenticación

### Comandos no aparecen
- Los comandos se registran al iniciar
- Espera 1-2 minutos después del deployment
- Verifica que el bot tenga permiso de "applications.commands"

### Error de base de datos
- Asegúrate de que `DATABASE_URL` esté configurada
- Verifica que el schema esté sincronizado: `npm run db:push -- --force`

### Build falla
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build para errores específicos

## 💡 Tips de Producción

1. **Monitoreo**: Usa los dashboards de la plataforma
2. **Backups**: Configura backups automáticos de PostgreSQL
3. **Escalabilidad**: El bot puede manejar múltiples servidores sin cambios
4. **Logs**: Mantén logs por al menos 7 días
5. **Secrets Rotation**: Rota tokens periódicamente

## 🎯 Checklist Pre-Deployment

- [ ] Token de Discord configurado
- [ ] API key de Gemini configurada
- [ ] Base de datos PostgreSQL provisionada
- [ ] Variables de entorno configuradas
- [ ] Health check endpoint funcionando
- [ ] Permisos del bot en Discord configurados
- [ ] Message Content Intent activado en Discord

---

¿Necesitas ayuda? Revisa los logs o contacta al maintainer del proyecto.
