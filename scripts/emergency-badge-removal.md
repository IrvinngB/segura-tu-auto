# Script de Emergencia para Eliminar Badge

Si el badge rojo aún sigue apareciendo, ejecutar este script en la consola del navegador:

## Opción 1: JavaScript de Emergencia
```javascript
// Ejecutar en la consola del navegador
function forceRemoveBadge() {
  console.log('🚨 EJECUTANDO LIMPIEZA DE EMERGENCIA');
  
  // 1. Ocultar todos los badges rojos visualmente
  document.querySelectorAll('.bg-red-500, .border-red-500').forEach(el => {
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
  });
  
  // 2. Limpiar localStorage
  localStorage.removeItem('unread-communications-cache');
  localStorage.clear();
  
  // 3. Forzar eventos de actualización
  window.dispatchEvent(new CustomEvent('communications-marked-as-read', {
    detail: { customerId: 'force-clear' }
  }));
  
  // 4. Buscar y ocultar cualquier elemento con texto "1"
  document.querySelectorAll('*').forEach(el => {
    if (el.textContent === '1' && el.classList.contains('bg-red-500')) {
      el.style.display = 'none';
    }
  });
  
  console.log('✅ Limpieza completada');
}

// Ejecutar limpieza
forceRemoveBadge();

// Ejecutar cada segundo por 10 segundos
let counter = 0;
const interval = setInterval(() => {
  forceRemoveBadge();
  counter++;
  if (counter >= 10) clearInterval(interval);
}, 1000);
```

## Opción 2: CSS de Emergencia
```css
/* Agregar este CSS temporalmente */
.bg-red-500.text-white.border-red-500 {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}
```

## Opción 3: Recargar Página
- Hacer hard refresh: Ctrl + F5
- Borrar cache del navegador
- Cerrar y abrir tab

## Verificación
El badge debe desaparecer inmediatamente al entrar a la página de comunicaciones.