/* 
 * EJEMPLO DE USO DE COMPONENTES OPTIMIZADOS
 * ==========================================
 * 
 * Este archivo muestra cómo usar los nuevos componentes optimizados
 * para mejorar el rendimiento de navegación.
 */

// ============================================================================
// EJEMPLO 1: Links de Navegación Optimizados
// ============================================================================

import { OptimizedLink } from "@/components/navigation/optimized-link";

function NavigationExample() {
  return (
    <nav>
      {/* ❌ ANTES: Link normal */}
      <Link href="/policies">Ver Pólizas</Link>
      
      {/* ✅ DESPUÉS: Link con prefetch automático */}
      <OptimizedLink href="/policies">
        Ver Pólizas
      </OptimizedLink>
      
      {/* El prefetch ocurre automáticamente al pasar el mouse */}
    </nav>
  );
}

// ============================================================================
// EJEMPLO 2: Botones de Navegación
// ============================================================================

import { NavigationButton } from "@/components/navigation/navigation-button";

function ButtonExample() {
  return (
    <div>
      {/* ❌ ANTES: Botón con onClick manual */}
      <Button onClick={() => router.push('/claims')}>
        Ver Reclamaciones
      </Button>
      
      {/* ✅ DESPUÉS: Botón optimizado con prefetch y transitions */}
      <NavigationButton 
        href="/claims" 
        variant="default"
      >
        Ver Reclamaciones
      </NavigationButton>
      
      {/* Muestra spinner automáticamente durante navegación */}
    </div>
  );
}

// ============================================================================
// EJEMPLO 3: Navegación Programática
// ============================================================================

import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";

function ProgrammaticNavigationExample() {
  const { navigate, prefetch, isPending } = useOptimizedNavigation();

  const handleSubmit = async (data: FormData) => {
    // Guardar datos
    await saveData(data);
    
    // ✅ Navegación optimizada con transition
    navigate('/success');
  };

  const handlePrefetch = () => {
    // ✅ Prefetch manual cuando sea necesario
    prefetch('/policies');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      
      {/* Botón muestra estado de pending */}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}

// ============================================================================
// EJEMPLO 4: Prefetch de Rutas Críticas
// ============================================================================

import { usePrefetchRoutes } from "@/components/navigation/optimized-link";

function DashboardExample() {
  // ✅ Prefetch automático de rutas más usadas
  usePrefetchRoutes([
    '/policies',
    '/claims',
    '/clients',
    '/customer/vehicles'
  ]);
  
  // Estas rutas se cargarán en background
  // Navegación será instantánea
  
  return <div>Dashboard content</div>;
}

// ============================================================================
// EJEMPLO 5: Loading States
// ============================================================================

import { LoadingScreen } from "@/components/ui/loading-screen";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

function LoadingExample() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    // ✅ Pantalla de carga completa
    return <LoadingScreen message="Cargando datos..." />;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

// ============================================================================
// EJEMPLO 6: Card con Navegación Optimizada
// ============================================================================

function OptimizedCardExample() {
  const { navigate } = useOptimizedNavigation();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/policies/123')}
    >
      <CardHeader>
        <CardTitle>Póliza #123</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Estado: Activa</p>
        {/* ✅ Link optimizado dentro de card */}
        <OptimizedLink 
          href="/policies/123"
          className="text-primary hover:underline"
        >
          Ver detalles →
        </OptimizedLink>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EJEMPLO 7: Lista con Navegación
// ============================================================================

function OptimizedListExample({ items }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <OptimizedLink
          key={item.id}
          href={`/policies/${item.id}`}
          className="block p-4 rounded-lg border hover:bg-muted"
        >
          <div className="flex justify-between">
            <span>{item.name}</span>
            <span className="text-muted-foreground">→</span>
          </div>
        </OptimizedLink>
      ))}
    </div>
  );
}

// ============================================================================
// EJEMPLO 8: Menú Dropdown con Navegación
// ============================================================================

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DropdownNavigationExample() {
  const { navigate } = useOptimizedNavigation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Acciones</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* ✅ Navegación optimizada en dropdown */}
        <DropdownMenuItem onClick={() => navigate('/policies/new')}>
          Nueva Póliza
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/claims/new')}>
          Nueva Reclamación
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// EJEMPLO 9: Tabs con Navegación
// ============================================================================

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

function TabsNavigationExample() {
  const pathname = usePathname();
  const { navigate } = useOptimizedNavigation();

  return (
    <Tabs value={pathname}>
      <TabsList>
        <TabsTrigger 
          value="/customer/policies"
          onClick={() => navigate('/customer/policies')}
        >
          Mis Pólizas
        </TabsTrigger>
        <TabsTrigger 
          value="/customer/claims"
          onClick={() => navigate('/customer/claims')}
        >
          Mis Reclamaciones
        </TabsTrigger>
        <TabsTrigger 
          value="/customer/vehicles"
          onClick={() => navigate('/customer/vehicles')}
        >
          Mis Vehículos
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// ============================================================================
// EJEMPLO 10: Página Completa Optimizada
// ============================================================================

export default function CompletePageExample() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // ✅ Prefetch de rutas relacionadas
  usePrefetchRoutes([
    '/policies/new',
    '/claims',
    '/customer/vehicles'
  ]);

  useEffect(() => {
    async function loadData() {
      // Cargar datos
      const result = await fetchData();
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

  // ✅ Loading state mientras carga
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pólizas</h1>
        
        {/* ✅ Botón de navegación optimizado */}
        <NavigationButton 
          href="/policies/new"
          variant="default"
        >
          Nueva Póliza
        </NavigationButton>
      </div>

      {/* ✅ Grid con links optimizados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.policies.map(policy => (
          <OptimizedLink
            key={policy.id}
            href={`/policies/${policy.id}`}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{policy.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Estado: {policy.status}</p>
              </CardContent>
            </Card>
          </OptimizedLink>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MEJORES PRÁCTICAS
// ============================================================================

/*
✅ DO:
- Usa OptimizedLink para todos los links de navegación
- Usa NavigationButton para botones que navegan
- Usa useOptimizedNavigation para navegación programática
- Prefetch rutas críticas con usePrefetchRoutes
- Muestra loading states durante navegación
- Usa Suspense con skeletons como fallback

❌ DON'T:
- No uses router.push() directamente
- No uses <a> tags para navegación interna
- No olvides prefetch en rutas comunes
- No bloquees la UI durante navegación
- No uses Link de Next.js sin prefetch

⚡ PERFORMANCE TIPS:
- Prefetch al hover, no al mount (ahorra recursos)
- Usa transitions para navegación (mejor UX)
- Implementa skeletons (mejor perceived performance)
- Cache datos con TTL razonable (10min es buen balance)
- Muestra feedback visual inmediato
*/
