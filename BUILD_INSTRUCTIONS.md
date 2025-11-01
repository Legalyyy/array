# Build Instructions

## Para hacer build del proyecto

Este proyecto ya no usa Vite para el build. En su lugar, usa un script de shell simple que:
1. Copia los archivos estáticos HTML/CSS/JS a `dist/client/`
2. Compila el servidor TypeScript con esbuild a `dist/`

### Opción 1: Usar el script de build (Recomendado)

```bash
./build.sh
```

### Opción 2: Build manual

```bash
# Crear estructura de directorios
mkdir -p dist/client

# Copiar archivos del cliente
cp -r client/* dist/client/

# Compilar el servidor
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Para ejecutar en producción

Después de hacer el build:

```bash
NODE_ENV=production node dist/index.js
```

## Variables de entorno requeridas

- `DISCORD_BOT_TOKEN` - Token de tu bot de Discord
- `GEMINI_API_KEY` - API key de Google Gemini
- `DATABASE_URL` - URL de conexión a PostgreSQL (opcional, si usas base de datos)

## Estructura después del build

```
dist/
├── client/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── index.js (servidor compilado)
```

## Notas

- El servidor detecta automáticamente si está en desarrollo o producción
- En desarrollo: sirve archivos desde `client/`
- En producción: sirve archivos desde `dist/client/`
