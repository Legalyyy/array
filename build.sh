#!/bin/bash

# MindLinkQuest - Automated Build & Deployment Script
# This script installs all dependencies, sets up the database, and starts the application
# Usage: ./build.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "  MindLinkQuest - Automated Build & Deployment"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Check Node.js installation
print_step "Verificando instalación de Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION encontrado"
echo ""

# Step 2: Check npm installation
print_step "Verificando instalación de npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm $NPM_VERSION encontrado"
echo ""

# Step 3: Clean previous installations (optional)
if [ "$1" == "--clean" ]; then
    print_step "Limpiando instalaciones anteriores..."
    rm -rf node_modules package-lock.json
    print_success "Instalaciones anteriores eliminadas"
    echo ""
fi

# Step 4: Install ALL dependencies
print_step "Instalando TODAS las dependencias del proyecto..."
echo "Esto puede tomar varios minutos..."
if npm install; then
    print_success "Todas las dependencias instaladas exitosamente"
else
    print_error "Error al instalar dependencias"
    exit 1
fi
echo ""

# Step 5: Check environment variables
print_step "Verificando variables de entorno requeridas..."
MISSING_VARS=()

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
    print_warning "DATABASE_URL no está configurada"
else
    print_success "DATABASE_URL configurada"
fi

# Check DISCORD_BOT_TOKEN (optional warning)
if [ -z "$DISCORD_BOT_TOKEN" ]; then
    print_warning "DISCORD_BOT_TOKEN no está configurada (el bot no funcionará)"
else
    print_success "DISCORD_BOT_TOKEN configurada"
fi

# Check SESSION_SECRET, generate if missing
if [ -z "$SESSION_SECRET" ]; then
    print_warning "SESSION_SECRET no configurado, generando uno..."
    # Try to generate a random secret
    if command -v openssl &> /dev/null; then
        export SESSION_SECRET=$(openssl rand -base64 32)
        print_success "SESSION_SECRET generado"
    else
        export SESSION_SECRET="default-secret-please-change-in-production"
        print_warning "SESSION_SECRET temporal generado (cambiar en producción)"
    fi
fi

echo ""

# Step 6: Database setup
if [ -n "$DATABASE_URL" ]; then
    print_step "Configurando base de datos..."
    
    # Push database schema
    print_step "Aplicando schema de base de datos (drizzle-kit push)..."
    if npm run db:push; then
        print_success "Schema de base de datos aplicado exitosamente"
    else
        print_warning "No se pudo aplicar el schema (puede que ya esté actualizado)"
    fi
    echo ""
else
    print_warning "Saltando configuración de base de datos (DATABASE_URL no configurada)"
    echo ""
fi

# Step 7: Build application (if not in development)
if [ "$NODE_ENV" == "production" ]; then
    print_step "Compilando aplicación para producción..."
    if npm run build; then
        print_success "Aplicación compilada exitosamente"
    else
        print_error "Error al compilar la aplicación"
        exit 1
    fi
    echo ""
fi

# Step 8: Summary
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✓ Build Completado Exitosamente!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Estado de configuración:"
echo "  ✓ Node.js $NODE_VERSION"
echo "  ✓ npm $NPM_VERSION"
echo "  ✓ Dependencias instaladas"

if [ -n "$DATABASE_URL" ]; then
    echo "  ✓ Base de datos configurada"
else
    echo "  ⚠ Base de datos no configurada"
fi

if [ -n "$DISCORD_BOT_TOKEN" ]; then
    echo "  ✓ Bot de Discord configurado"
else
    echo "  ⚠ Bot de Discord no configurado"
fi

echo ""
echo "Para iniciar la aplicación:"

if [ "$NODE_ENV" == "production" ]; then
    echo "  npm start              - Iniciar en producción"
else
    echo "  npm run dev            - Iniciar en desarrollo"
fi

echo ""
echo "Otros comandos útiles:"
echo "  npm run build          - Compilar para producción"
echo "  npm run db:push        - Actualizar schema de base de datos"
echo "  npm run check          - Verificar tipos TypeScript"
echo ""

# Step 9: Auto-start in production (for Render)
if [ "$AUTO_START" == "true" ] || [ "$NODE_ENV" == "production" ]; then
    print_step "Auto-iniciando aplicación en modo producción..."
    echo ""
    exec npm start
fi
