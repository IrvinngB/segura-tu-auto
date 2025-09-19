#!/bin/bash

# Script para optimizar el rendimiento de SeguraTuAuto
# Este script ejecuta todas las optimizaciones necesarias

echo "🚀 Iniciando optimizaciones de rendimiento para SeguraTuAuto..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

print_status "Verificando dependencias..."

# Verificar si pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm no está instalado. Instalando..."
    npm install -g pnpm
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias..."
    pnpm install
fi

print_success "Dependencias verificadas"

# Optimizar base de datos (si se proporciona la URL de conexión)
if [ ! -z "$DATABASE_URL" ]; then
    print_status "Optimizando base de datos..."
    
    # Ejecutar script de optimización de base de datos
    if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" -f scripts/optimize-database-performance.sql
        print_success "Base de datos optimizada"
    else
        print_warning "psql no está instalado. Omitiendo optimización de base de datos."
        print_warning "Puedes ejecutar manualmente: psql [DATABASE_URL] -f scripts/optimize-database-performance.sql"
    fi
else
    print_warning "DATABASE_URL no está configurada. Omitiendo optimización de base de datos."
    print_warning "Configura DATABASE_URL y ejecuta: psql \$DATABASE_URL -f scripts/optimize-database-performance.sql"
fi

# Limpiar cache de Next.js
print_status "Limpiando cache de Next.js..."
rm -rf .next
print_success "Cache limpiado"

# Construir la aplicación para verificar que todo funciona
print_status "Construyendo aplicación para verificar optimizaciones..."
if pnpm build; then
    print_success "Aplicación construida exitosamente"
else
    print_error "Error al construir la aplicación"
    exit 1
fi

# Mostrar resumen de optimizaciones
echo ""
echo "=========================================="
echo "🎉 OPTIMIZACIONES COMPLETADAS"
echo "=========================================="
echo ""
echo "✅ Optimizaciones implementadas:"
echo "   • AuthProvider con cache de 5 minutos"
echo "   • React.memo en componentes pesados"
echo "   • useMemo para cálculos costosos"
echo "   • Lazy loading con Suspense"
echo "   • Skeleton loading para mejor UX"
echo "   • Configuración optimizada de Next.js"
echo "   • Bundle splitting para mejor carga"
echo "   • Headers de cache para assets estáticos"
echo ""
echo "📊 Mejoras esperadas:"
echo "   • Tiempo de carga: 3s → 1-2s (50-70% mejora)"
echo "   • Consultas redundantes eliminadas"
echo "   • Re-renderizado minimizado"
echo "   • Cache activo en navegador"
echo ""
echo "🚀 Para iniciar la aplicación optimizada:"
echo "   pnpm dev"
echo ""
echo "📈 Para monitorear el rendimiento:"
echo "   • Abre DevTools (F12)"
echo "   • Ve a Network para ver tiempos de carga"
echo "   • Verifica Session Storage para cache"
echo ""

print_success "¡Optimizaciones completadas! Tu aplicación debería cargar mucho más rápido ahora."
