# 🚀 Guía de Despliegue - SeguraTuAuto

## 📋 Prerrequisitos

Antes de desplegar, asegúrate de tener configurado:

### 1. Repositorio en GitHub
- Crea un repositorio en GitHub
- Sube tu código: `git push origin main`

### 2. Vercel Account
- Crea una cuenta en [Vercel](https://vercel.com)
- Conecta tu repositorio de GitHub

### 3. Supabase Project
- Proyecto de Supabase configurado
- Base de datos con las tablas necesarias

## 🔧 Variables de Entorno en Vercel

Configura estas variables en tu proyecto de Vercel (Settings → Environment Variables):

### Variables Requeridas
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
NEXT_PUBLIC_APP_NAME=SeguraTuAuto

# Environment
NEXT_PUBLIC_NODE_ENV=production
NODE_ENV=production
```

### Variables Opcionales (para funcionalidades avanzadas)
```bash
# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Payments (Stripe)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Monitoring
SENTRY_DSN=https://...
```

## 🚀 Despliegue Automático

### Opción 1: Despliegue Automático con GitHub Actions

1. **Configura los secrets en GitHub:**
   - Ve a tu repositorio → Settings → Secrets and variables → Actions
   - Agrega estos secrets:

   ```
   VERCEL_TOKEN=tu_vercel_token
   VERCEL_ORG_ID=tu_org_id
   VERCEL_PROJECT_ID=tu_project_id
   SUPABASE_ACCESS_TOKEN=tu_supabase_token
   SUPABASE_PROJECT_REF=tu_project_ref
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   NEXT_PUBLIC_APP_NAME=SeguraTuAuto
   ```

2. **Push a la rama main:**
   ```bash
   git add .
   git commit -m "Deploy: Configuración CI/CD"
   git push origin main
   ```

### Opción 2: Despliegue Manual en Vercel

1. **Importa tu proyecto en Vercel**
2. **Configura las variables de entorno** (como se indicó arriba)
3. **Deploy automático** se activará con cada push

## 🔍 Verificación del Despliegue

Después del despliegue, verifica:

1. **Build exitoso** en Vercel dashboard
2. **Funcionalidades básicas:**
   - ✅ Login/Registro funciona
   - ✅ Conexión a Supabase
   - ✅ Páginas cargan correctamente
   - ✅ API routes responden

3. **URLs importantes:**
   - App: `https://tu-app.vercel.app`
   - Supabase Dashboard: `https://supabase.com/dashboard/project/tu-project`

## 🐛 Troubleshooting

### Error: "Build failed"
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel
- Asegúrate de que las variables de entorno estén configuradas

### Error: "Database connection failed"
- Verifica las credenciales de Supabase
- Confirma que la base de datos esté activa
- Revisa las políticas RLS en Supabase

### Error: "Environment variables not found"
- Verifica que todas las variables requeridas estén configuradas en Vercel
- Asegúrate de que los nombres coincidan exactamente

## 📊 Monitoreo

### Métricas importantes:
- **Response times** de las APIs
- **Error rates** en logs
- **User sessions** activas
- **Database performance**

### Herramientas recomendadas:
- **Vercel Analytics** - Para métricas de performance
- **Supabase Dashboard** - Para métricas de base de datos
- **Sentry** - Para error tracking (opcional)

## 🔄 Actualizaciones

Para actualizar la aplicación:

1. **Haz cambios en tu código local**
2. **Commit y push:**
   ```bash
   git add .
   git commit -m "feat: Nueva funcionalidad"
   git push origin main
   ```
3. **Vercel detectará el push automáticamente** y desplegará

## 📞 Soporte

Si tienes problemas con el despliegue:
1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración de variables de entorno
3. Consulta la documentación de Next.js/Vercel
4. Revisa issues similares en GitHub

---

**¡Tu aplicación está lista para producción!** 🎉