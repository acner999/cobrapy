# Deploy CobraPy — Railway + Vercel

## Arquitectura
- **Railway** — backend NestJS + PostgreSQL + Redis
- **Vercel** — dashboard Next.js (gratis, cero config)

---

## Parte 1 — Backend en Railway

### 1.1 Crear cuenta y proyecto
1. Ir a **railway.app** → "Start a New Project"
2. Conectar con GitHub y autorizar el repositorio `cobrapy`
3. Railway detecta el `Dockerfile` automáticamente

### 1.2 Agregar servicios
En el proyecto de Railway, agregar:
- **PostgreSQL** — click "Add Service" → "Database" → "PostgreSQL"
- **Redis** — click "Add Service" → "Database" → "Redis"

Railway genera automáticamente las variables de conexión internas.

### 1.3 Variables de entorno del backend
En el servicio del backend → **Variables**, agregar:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

JWT_SECRET=UnStringMuyLargoYAleatorio64Caracteres
ADMIN_TOKEN=OtroTokenSeguroParaAdmin

NODE_ENV=production

# Usuario demo del dashboard (entra por /v1/auth/login)
SEED_DEMO_EMAIL=acner@elyon.com.py
SEED_DEMO_NAME=Acner Pinazo
SEED_DEMO_PASSWORD=TuPasswordSeguro

# Manager del mismo comercio demo
SEED_MANAGER_EMAIL=gerente@elyon.com.py
SEED_MANAGER_NAME=Gerente Demo
SEED_MANAGER_PASSWORD=TuPasswordSeguro

# Operador del mismo comercio demo
SEED_OPERATOR_EMAIL=cajero@elyon.com.py
SEED_OPERATOR_NAME=Cajero Demo
SEED_OPERATOR_PASSWORD=TuPasswordSeguro

# Contador del mismo comercio demo
SEED_ACCOUNTANT_EMAIL=contador@elyon.com.py
SEED_ACCOUNTANT_NAME=Contador Demo
SEED_ACCOUNTANT_PASSWORD=TuPasswordSeguro

# Admin del portal admin (entra por /v1/admin-portal/auth/login)
SEED_ADMIN_EMAIL=acner@elyon.com.py
SEED_ADMIN_NAME=Acner Pinazo
SEED_ADMIN_PASSWORD=TuPasswordSeguro
```

> Las variables con `${{Postgres.DATABASE_URL}}` Railway las resuelve solo — no escribas la URL a mano.

### 1.4 Deploy
Railway hace deploy automático en cada push a `main`. El primer deploy tarda ~5 minutos.

El start command en `railway.json` corre automáticamente:
```
npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/src/main.js
```

### 1.5 Verificar
```
https://TU_APP.up.railway.app/          ← Landing page
https://TU_APP.up.railway.app/v1/docs   ← Swagger UI
https://TU_APP.up.railway.app/health    ← Health check
```

---

## Parte 2 — Dashboard en Vercel

### 2.1 Crear proyecto
1. Ir a **vercel.com** → "Add New Project"
2. Importar el repositorio `cobrapy` desde GitHub
3. **Root Directory**: `dashboard`
4. Framework: Next.js (lo detecta solo)

### 2.2 Variables de entorno
En Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://TU_APP.up.railway.app
```

### 2.3 Deploy
Click "Deploy". Vercel da una URL tipo `cobrapy-dashboard.vercel.app`.

Cada push a `main` hace redeploy automático.

---

## Actualizaciones (deploys futuros)

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Railway y Vercel se actualizan solos.

---

## Comandos útiles

### Ver logs del backend
En Railway → tu servicio → **Deployments** → click en el deploy activo → **View Logs**

### Forzar redeploy sin cambios de código
Railway → tu servicio → **Deployments** → "Redeploy"

### Correr seed manualmente (si falló)
Railway → tu servicio → **Settings** → cambiar temporalmente el start command a:
```
npx tsx prisma/seed.ts && node dist/src/main.js
```
Redeploy → cuando termine volver al comando original.

### Conectarse a la base de datos
Railway → PostgreSQL → **Connect** → copiá la connection string y usá con DBeaver o TablePlus.

---

## URLs de producción

| Servicio | URL |
|---|---|
| Backend API | `https://cobrapy-production.up.railway.app` |
| Swagger Docs | `https://cobrapy-production.up.railway.app/v1/docs` |
| Dashboard | pendiente (Vercel) |
