#!/bin/bash

# Script de implementación para la solución de pólizas vencidas
# Ejecutar este script paso a paso para implementar la solución completa

echo "=================================================="
echo "🔧 IMPLEMENTACIÓN DE SOLUCIÓN DE PÓLIZAS VENCIDAS"
echo "=================================================="
echo ""

echo "📋 PASOS A SEGUIR:"
echo ""

echo "1️⃣  CREAR FUNCIONES EN LA BASE DE DATOS"
echo "   Ejecutar en tu base de datos PostgreSQL/Supabase:"
echo "   📁 Archivo: scripts/update-expired-policies.sql"
echo ""
echo "   Puedes ejecutarlo de una de estas formas:"
echo "   - En Supabase Dashboard → SQL Editor → Pegar el contenido del archivo"
echo "   - O usando psql: psql -d tu_base_de_datos -f scripts/update-expired-policies.sql"
echo ""

echo "2️⃣  VERIFICAR ESTADO ACTUAL"
echo "   Para ver qué pólizas están vencidas actualmente:"
echo "   📁 Archivo: scripts/check-policy-status.sql"
echo ""

echo "3️⃣  ACCEDER AL PANEL DE ADMINISTRACIÓN"
echo "   Una vez implementado, ir a:"
echo "   🌐 URL: http://localhost:3001/admin"
echo "   👤 Requiere usuario con rol 'admin' o 'agent'"
echo ""

echo "4️⃣  PROBAR LA FUNCIONALIDAD"
echo "   - El dashboard del cliente ahora actualiza automáticamente"
echo "   - La lista de pólizas también se actualiza automáticamente"
echo "   - El panel de admin permite gestión manual"
echo ""

echo "=================================================="
echo "📊 ARCHIVOS CREADOS/MODIFICADOS:"
echo "=================================================="
echo ""

echo "🆕 NUEVOS ARCHIVOS:"
echo "   📄 lib/policy-expiration.ts"
echo "   📄 components/policies/policy-expiration-manager.tsx"
echo "   📄 app/admin/page.tsx"
echo "   📄 scripts/update-expired-policies.sql"
echo "   📄 scripts/check-policy-status.sql"
echo "   📄 docs/POLICY_EXPIRATION_SOLUTION.md"
echo ""

echo "✏️  ARCHIVOS MODIFICADOS:"
echo "   📄 app/customer/dashboard/page.tsx (agregado autoUpdateExpiredPolicies)"
echo "   📄 components/policies/policy-list.tsx (agregado autoUpdateExpiredPolicies)"
echo ""

echo "=================================================="
echo "🎯 RESULTADO ESPERADO:"
echo "=================================================="
echo ""

echo "✅ Las pólizas vencidas se marcarán automáticamente como 'expired'"
echo "✅ El dashboard mostrará estados correctos"
echo "✅ Herramientas de administración disponibles"
echo "✅ Verificación automática en cada carga de datos"
echo ""

echo "=================================================="
echo "🔍 CÓMO VERIFICAR QUE FUNCIONA:"
echo "=================================================="
echo ""

echo "1. Ejecutar el script SQL: scripts/update-expired-policies.sql"
echo "2. Ejecutar: SELECT * FROM update_expired_policies();"
echo "3. Ver si se actualizaron pólizas"
echo "4. Recargar el dashboard del cliente"
echo "5. Verificar que las pólizas vencidas aparezcan como 'Vencida'"
echo ""

echo "=================================================="
echo "📞 EN CASO DE PROBLEMAS:"
echo "=================================================="
echo ""

echo "1. Verificar que las funciones SQL se crearon correctamente"
echo "2. Comprobar permisos de base de datos"
echo "3. Revisar console del navegador para errores"
echo "4. Leer la documentación completa en: docs/POLICY_EXPIRATION_SOLUTION.md"
echo ""

echo "¡Implementación lista! 🚀"