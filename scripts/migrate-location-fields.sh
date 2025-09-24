#!/bin/bash

# Script para aplicar la migración de campos de ubicación
echo "🚀 Aplicando migración de campos de ubicación..."

# Verificar si Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado. Instalando..."
    npm install -g supabase
fi

echo "📄 Aplicando migración a la base de datos..."

# Aplicar el script SQL
supabase db push --db-url="$DATABASE_URL" --schema=./scripts/add-location-fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración aplicada exitosamente!"
    echo ""
    echo "📊 Nuevos campos agregados:"
    echo "  - address (Dirección completa)"
    echo "  - postal_code (Código postal)"
    echo "  - neighborhood (Colonia/Barrio)" 
    echo "  - risk_zone (Zona de riesgo automática)"
    echo ""
    echo "🏗️ Tablas creadas:"
    echo "  - risk_zones (Configuración de zonas de riesgo)"
    echo ""
    echo "⚡ Funciones agregadas:"
    echo "  - get_risk_zone_by_location() (Asignación automática de zona)"
    echo "  - update_customer_risk_zone() (Trigger para actualización)"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "  1. Probar el registro de nuevos clientes"
    echo "  2. Verificar cálculo automático de zonas de riesgo"
    echo "  3. Revisar impacto en cotizaciones"
else
    echo "❌ Error aplicando la migración. Revisar logs."
    exit 1
fi