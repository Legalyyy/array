# Solución: Comando /code No Aparece Para Usuarios Normales

## ✅ Cambios Realizados

He actualizado el bot de Discord para garantizar que **TODOS** los usuarios puedan ver y usar el comando `/code`:

### 1. Verificación del Comando
- ✅ El comando `/code` está configurado **SIN** restricciones de permisos
- ✅ Cualquier usuario puede ejecutarlo (no requiere rol de moderador/admin)

### 2. Actualización Forzada del Cache de Discord
- ✅ Ahora el bot registra comandos **globalmente** (para todos los servidores)
- ✅ **ADEMÁS** registra comandos específicamente en tu servidor (guild-specific)
- ✅ Esto fuerza a Discord a actualizar el cache **inmediatamente**

## 🚀 Cómo Aplicar Los Cambios

### Opción 1: Deploy Automático (Recomendado)

Si tu proyecto está en **Render** con auto-deploy:

1. **Push a GitHub**:
   ```bash
   git add .
   git commit -m "Fix: /code command now visible to all users"
   git push origin main
   ```

2. **Render desplegará automáticamente**
3. **Espera 2-3 minutos** para que el bot se reinicie
4. **Verifica en Discord** (ver sección de verificación abajo)

### Opción 2: Deploy Manual en Render

1. Ve a tu **Render Dashboard**
2. Selecciona tu **Web Service**
3. Click en **"Manual Deploy"** → **"Deploy latest commit"**
4. Espera a que termine el deploy
5. **Verifica en Discord**

## 🔍 Verificación en Discord

### Paso 1: Verifica que el Bot Esté Online
- El bot debe aparecer **online** en tu servidor de Discord
- Si no está online, revisa los logs en Render

### Paso 2: Verifica los Logs en Render
Deberías ver estos mensajes en los logs:

```
✅ Discord bot logged in as TuBot#1234
✅ Slash commands registered globally
✅ Slash commands registered in guild: NombreDeTuServidor
   This ensures /code and other commands appear immediately for all users
```

### Paso 3: Prueba el Comando con Usuario Normal

1. **Inicia sesión en Discord** con una cuenta **SIN** permisos de admin/mod
2. **En tu servidor**, escribe `/` en cualquier canal
3. **Busca** el comando `/code` en la lista de comandos
4. **Debe aparecer** con la descripción: "generate a unique access code for web login"
5. **Ejecuta** el comando y verifica que funciona

## 🔧 Si el Comando Aún No Aparece

### Solución 1: Esperar Propagación de Discord
- Los comandos **globales** pueden tardar **hasta 1 hora** en propagarse
- Los comandos **guild-specific** aparecen **inmediatamente**
- Si configuraste `DISCORD_GUILD_ID` correctamente, debería ser instantáneo

### Solución 2: Verificar DISCORD_GUILD_ID

Asegúrate de que la variable `DISCORD_GUILD_ID` esté configurada correctamente:

1. **En Discord**: Click derecho en tu servidor → **"Copiar ID del servidor"**
   - (Asegúrate de tener el **Modo Desarrollador** activado en Ajustes → Avanzado)
2. **En Render**: Ve a Environment Variables
3. **Verifica** que `DISCORD_GUILD_ID` tenga el ID correcto de tu servidor
4. **Si lo cambiaste**, haz un re-deploy

### Solución 3: Limpiar Cache de Comandos de Discord (Última Opción)

Si después de 1 hora el comando aún no aparece para usuarios normales:

1. **Cierra Discord completamente** (no solo minimizar)
2. **En Windows**: 
   - Presiona `Ctrl + R`
   - Escribe: `%appdata%/discord/Cache`
   - Borra todo el contenido de la carpeta
3. **En Mac**:
   - Ve a `~/Library/Application Support/Discord/Cache`
   - Borra todo el contenido
4. **En Web**: Limpia la cache del navegador (Ctrl+Shift+Delete)
5. **Reinicia Discord** y verifica de nuevo

## 📝 Comandos Disponibles para TODOS los Usuarios

Estos comandos **NO** requieren permisos especiales:

- `/code` - Generar código de acceso para login web
- `/help` - Ver todos los comandos disponibles
- `/recap` - Registrar un trade
- `/myrecaps` - Ver tus propios trades
- `/recaps @usuario` - Ver trades de otro usuario
- `/gallery` - Ver galería de screenshots
- `/vc` - Crear canal de voz propio
- `/access` - Solicitar acceso a leaks
- `/request` - Hacer una solicitud

## 🔐 Comandos Solo para Admins

Estos comandos **SÍ** requieren permisos de administrador:

- `/embed` - Admin
- `/bible` - Admin
- `/news` - Admin
- `/vcsetup` - Admin
- `/setupsignup` - Admin
- `/reqrequest` - Admin

## 🐛 Troubleshooting

### "El comando aparece pero dice que no tengo permisos"
- Esto **NO** debería pasar con `/code`
- Si pasa, revisa los logs del bot para errores
- Verifica que no haya código custom que restrinja el comando

### "El bot no responde al comando"
- Verifica que el bot esté **online** en Discord
- Revisa los **logs en Render** para errores
- Asegúrate de que `DISCORD_BOT_TOKEN` esté configurado correctamente

### "Los comandos aparecen duplicados"
- Esto es normal temporalmente
- Discord está sincronizando comandos globales y guild-specific
- Los duplicados desaparecerán en ~1 hora

## ✅ Checklist Final

Antes de reportar problemas, verifica:

- [ ] El bot está **online** en Discord
- [ ] Los logs de Render muestran: `✅ Slash commands registered in guild`
- [ ] `DISCORD_GUILD_ID` está configurado correctamente en Render
- [ ] Has esperado al menos **5 minutos** después del deploy
- [ ] Has probado con una cuenta **sin permisos de admin**
- [ ] Has intentado escribir `/code` (no solo `/`)

---

Si después de seguir todos estos pasos el problema persiste, comparte:
1. Logs completos del bot en Render
2. Screenshot de las variables de entorno (censura los valores sensibles)
3. Screenshot del comando no apareciendo en Discord
