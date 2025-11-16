# 🛠️ Soluciones de Código - Optimización de Rendimiento

## 1. AuthProvider Optimizado

```typescript
// components/auth/auth-provider-optimized.tsx
'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User as DatabaseUser } from '@/lib/types/database';

interface AuthContextType {
  user: User | null;
  userProfile: DatabaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAllCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const cacheKey = `user_profile_${userId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
          return parsed.data;
        }
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [supabase]);

  const clearAllCache = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('user_profile_') || key.includes('customer_data_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAllCache();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase, clearAllCache]);

  const refreshUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
  }, [supabase, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) setUserProfile(profile);
        }
        if (mounted) setLoading(false);
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT') clearAllCache();
        
        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) setUserProfile(profile);
        } else {
          if (mounted) setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, clearAllCache]);

  // ✅ CLAVE: Memoizar el value del contexto
  const value = useMemo(
    () => ({ user, userProfile, loading, signOut, refreshUser, clearAllCache }),
    [user, userProfile, loading, signOut, refreshUser, clearAllCache]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## 2. React Query Setup

```typescript
// lib/react-query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutos
          gcTime: 10 * 60 * 1000, // 10 minutos
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx - Agregar provider
import { ReactQueryProvider } from '@/lib/react-query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ReactQueryProvider>
              <IdleTimer />
              <AppLayout>{children}</AppLayout>
            </ReactQueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 3. Hook Optimizado con React Query

```typescript
// hooks/use-recent-claims-optimized.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useEffect, useMemo } from 'react';

export function useRecentClaimsOptimized(limit: number = 3) {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const fetchDashboardData = async () => {
    if (!user || !userProfile) throw new Error('No user');

    if (userProfile.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customerData) throw new Error('Customer not found');

      const [policiesResult, claimsResult] = await Promise.all([
        supabase.from('policies').select('id, status').eq('customer_id', customerData.id),
        supabase
          .from('claims')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('updated_at', { ascending: false })
          .limit(limit),
      ]);

      return {
        stats: {
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims: claimsResult.data?.filter(c => 
            !['closed', 'paid', 'denied'].includes(c.status)
          ).length || 0,
          totalClients: 1,
          pendingAssessments: claimsResult.data?.filter(c => 
            c.status === 'under_review'
          ).length || 0,
        },
        recentClaims: claimsResult.data || [],
      };
    }

    // Lógica similar para otros roles...
    return { stats: {}, recentClaims: [] };
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', user?.id, userProfile?.role, limit],
    queryFn: fetchDashboardData,
    enabled: !!user && !!userProfile,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // ✅ Solo realtime, sin polling
  useEffect(() => {
    if (!user || !userProfile) return;

    const channel = supabase
      .channel(`dashboard-${user.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'claims',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user, userProfile, queryClient, supabase]);

  return {
    recentClaims: data?.recentClaims || [],
    stats: data?.stats || {
      totalPolicies: 0,
      activeClaims: 0,
      totalClients: 0,
      pendingAssessments: 0,
    },
    loading: isLoading,
    lastUpdated: new Date(),
    refresh: refetch,
  };
}
```

---

## 4. Hook de Debounce

```typescript
// hooks/use-debounced-value.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Uso:**
```typescript
// En claim-list.tsx
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  filterClaims();
}, [claims, debouncedSearch, statusFilter, typeFilter, priorityFilter]);
```

---

## 5. Virtualización de Listas

```bash
npm install react-window react-window-infinite-loader
```

```typescript
// components/claims/claim-list-virtualized.tsx
'use client';

import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Claim } from '@/lib/types/database';

interface VirtualizedClaimListProps {
  claims: Claim[];
  onView: (claim: Claim) => void;
  onEdit: (claim: Claim) => void;
}

export function VirtualizedClaimList({ claims, onView, onEdit }: VirtualizedClaimListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const claim = claims[index];
    
    return (
      <div style={style} className="flex items-center border-b p-4 hover:bg-muted/50">
        <div className="flex-1">
          <div className="font-medium">{claim.claim_number}</div>
          <div className="text-sm text-muted-foreground">{claim.claim_type}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onView(claim)}>
            Ver
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(claim)}>
            Editar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={claims.length}
            itemSize={80}
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
```

---

## 6. Lazy Loading de Componentes

```typescript
// app/admin/page.tsx
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const AdminDashboard = dynamic(
  () => import('@/components/admin/admin-dashboard'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export default function AdminPage() {
  return <AdminDashboard />;
}
```

```typescript
// Formularios pesados
const ClaimForm = dynamic(() => import('./claim-form'), {
  loading: () => <FormSkeleton />,
});

const QuoteForm = dynamic(() => import('./quote-form'), {
  loading: () => <FormSkeleton />,
});
```

---

## 7. Componentes Memoizados

```typescript
// components/dashboard/stats-cards.tsx
import { memo } from 'react';

interface StatsCardsProps {
  stats: {
    totalPolicies: number;
    activeClaims: number;
    totalClients: number;
    pendingAssessments: number;
  };
}

export const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Pólizas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPolicies}</div>
        </CardContent>
      </Card>
      {/* Más cards... */}
    </div>
  );
});
```

---

## 8. Optimización de next.config.mjs

```javascript
// next.config.mjs
const nextConfig = {
  // ... configuración existente ...
  
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      '@supabase/supabase-js'
    ],
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
```

---

## 9. Loading States

```typescript
// app/admin/loading.tsx
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default function Loading() {
  return <DashboardSkeleton />;
}
```

```typescript
// app/claims/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
```

---

## 10. Instalación de Dependencias

```bash
# React Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# Virtualización
npm install react-window react-window-infinite-loader
npm install --save-dev @types/react-window

# Auto Sizer (opcional)
npm install react-virtualized-auto-sizer
```

---

## 📊 Checklist de Implementación

### Fase 1 (Crítico)
- [ ] Reemplazar `auth-provider.tsx` con versión optimizada
- [ ] Instalar React Query
- [ ] Agregar `ReactQueryProvider` en `layout.tsx`
- [ ] Migrar `use-recent-claims.ts` a React Query
- [ ] Eliminar polling de `claim-list.tsx`
- [ ] Implementar lazy loading en admin

### Fase 2 (Importante)
- [ ] Instalar react-window
- [ ] Virtualizar `claim-list.tsx`
- [ ] Agregar `React.memo` a componentes
- [ ] Crear hook `use-debounced-value`
- [ ] Aplicar debounce en búsquedas

### Fase 3 (Mejoras)
- [ ] Optimizar `next.config.mjs`
- [ ] Crear `loading.tsx` en rutas
- [ ] Lazy load de modales
- [ ] Optimizar imports de date-fns

---

**Tiempo estimado:** 3-4 semanas
**Impacto esperado:** 70-80% mejora en rendimiento
