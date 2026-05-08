# CobraPy — Guía de Testing Local

Cheat-sheet con los usuarios precargados y cómo probar el bot de WhatsApp.

---

## 1. Arrancar el entorno

```powershell
cd C:\Repos\Personal\cobrapy

# Servicios (Postgres + Redis)
docker compose up -d

# Backend (puerto 3000)
npm install
npx prisma migrate dev
npm run db:seed     # imprime credenciales y API key inicial
npm run dev

# Dashboard (puerto 3001) — en otra terminal
cd dashboard
npm install
npm run dev
```

URLs:
- Backend API → http://localhost:3000/v1
- Swagger → http://localhost:3000/docs
- Dashboard → http://localhost:3001

---

## 2. Usuarios de prueba

Todos los emails son los **defaults de dev**. Para overridearlos, definí las variables `SEED_*` en tu `.env`. En producción esas variables son obligatorias (sin defaults).

Password por defecto: `cobrapy123`.

### Comercio Demo (los 4 roles posibles del Membership)

| Rol | Email default | Override env | Qué puede hacer |
|---|---|---|---|
| **OWNER** | `demo@cobrapy.test` | `SEED_DEMO_*` | Todo. Único; no se puede degradar ni invitar a otro OWNER. |
| **ADMIN** | `gerente@cobrapy.test` | `SEED_MANAGER_*` | Igual que OWNER salvo billing y eliminar comercio. Puede invitar y manejar equipo. |
| **OPERATOR** | `cajero@cobrapy.test` | `SEED_OPERATOR_*` | Crear cobros y ver reportes. **No** invita ni toca API keys / webhooks / settings. |
| **READONLY** | `contador@cobrapy.test` | `SEED_ACCOUNTANT_*` | Solo lectura. Pensado para contadores externos. |

### Staff portal (admin interno de CobraPy)

| Email default | Override env | Login |
|---|---|---|
| `admin@cobrapy.test` | `SEED_ADMIN_*` | http://localhost:3001/admin/login |

### Login de comercio (dashboard)

1. Ir a http://localhost:3001/login
2. Email: `demo@cobrapy.test` · Password: `cobrapy123`
3. Te redirige a `/charges`

### Login del staff (portal admin)

1. Ir a http://localhost:3001/admin/login
2. Email: `admin@cobrapy.test` · Password: `cobrapy123`
3. Te redirige a `/admin` (overview con métricas)

### Probar permisos por rol

Probá los 4 roles haciendo login con cada email y mirando qué cambia en `/settings/team`:

| Login | Esperado |
|---|---|
| `demo@cobrapy.test` (OWNER) | Ve botón "Invitar miembro". Puede cambiar roles y quitar miembros (excepto a sí mismo). |
| `gerente@cobrapy.test` (ADMIN) | Igual que OWNER. Solo no puede tocar al OWNER ni cambiar el rol del OWNER. |
| `cajero@cobrapy.test` (OPERATOR) | Puede LISTAR el equipo. Si intenta invitar (vía API) recibe 403: *"Se requiere rol ADMIN o superior (actual: OPERATOR)"*. |
| `contador@cobrapy.test` (READONLY) | Igual que OPERATOR para teams. Tampoco puede crear cobros (próxima iteración: hide UI por rol). |

### API key inicial del seed

El comando `npm run db:seed` imprime la API key del Comercio Demo en la consola. Sirve para llamadas server-to-server (en lugar del JWT de usuario):

```
API KEY: ck_test_<random>
```

Si la perdiste, corré `npm run db:seed` de nuevo (no duplica usuarios; solo recrea si no existe).

---

## 3. Probar el bot de WhatsApp

El módulo de WhatsApp tiene un **simulador** (`POST /whatsapp/simulate`) que corre el flujo entero sin necesidad de Twilio. Eso te permite testear localmente.

### 3.1 Sin Twilio (simulador local)

**Paso 1 — vincular un número al comercio.**

Conseguí el JWT del usuario:

```powershell
$LOGIN = curl -s -X POST http://localhost:3000/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"demo@cobrapy.test\",\"password\":\"cobrapy123\"}' | ConvertFrom-Json
$TOKEN = $LOGIN.token
```

Vinculá tu número:

```powershell
curl -X POST http://localhost:3000/v1/whatsapp/accounts `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"phone\":\"+595981000000\"}'
```

**Paso 2 — simular un mensaje entrante.**

```powershell
# Pedir ayuda
curl -X POST http://localhost:3000/v1/whatsapp/simulate `
  -H "Content-Type: application/json" `
  -d '{\"fromPhone\":\"+595981000000\",\"body\":\"ayuda\"}'

# Crear un cobro
curl -X POST http://localhost:3000/v1/whatsapp/simulate `
  -H "Content-Type: application/json" `
  -d '{\"fromPhone\":\"+595981000000\",\"body\":\"cobro 50000 a Juan\"}'
```

Respuesta esperada del segundo:

```json
{
  "intent": "charge",
  "chargeId": "cmox...",
  "reply": "✅ *Cobro creado: Gs. 50.000*\nConcepto: Juan\nCompartí este link con tu cliente:\nhttp://localhost:3001/p/cmox...\nVence en 30 minutos."
}
```

### 3.2 Comandos que entiende el bot

| Mensaje | Resultado |
|---|---|
| `cobro 50000` | Crea cobro de Gs. 50.000 |
| `cobro Gs. 50.000 a Juan` | Cobro con descripción "Juan" |
| `cobrar 1.500.000 por servicio mensual` | Cobro con descripción libre |
| `50000` (solo número) | Cobro implícito |
| `ayuda` / `help` / `menu` / `hola` | Muestra menú |
| `saldo` / `balance` | Placeholder ("próximamente") |
| Cualquier cosa rara | "No entendí. Escribí *ayuda*." |
| Mensaje desde un teléfono **no vinculado** | "🚫 Este número no está vinculado..." |

### 3.3 Con Twilio (sandbox real)

**Requisitos:**
- Cuenta gratis en Twilio.
- Sandbox de WhatsApp activado (instantáneo, sin verificación).
- Túnel público para que Twilio llegue al `localhost:3000`.

**Paso 1 — túnel con Cloudflare:**

```powershell
cloudflared tunnel --url http://localhost:3000
```

Te da una URL tipo `https://theatre-upgrades-roll-les.trycloudflare.com`. **Dejá esa terminal abierta** mientras pruebes.

**Paso 2 — credenciales en `.env`:**

```
TWILIO_ACCOUNT_SID=AC...           # Console → Account Dashboard
TWILIO_AUTH_TOKEN=...              # mismo lugar, click "View"
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886    # número del sandbox
PUBLIC_BASE_URL=http://localhost:3001
```

Reiniciá el backend (`npm run dev`).

**Paso 3 — webhook en Twilio:**

Console → Messaging → Try it out → Send a WhatsApp message → **Sandbox Configuration**.

En "WHEN A MESSAGE COMES IN" pegá:

```
https://<tu-tunel>.trycloudflare.com/v1/whatsapp/webhook
```

Método: `POST`. Save.

**Paso 4 — activar tu WhatsApp en el sandbox:**

En la misma página vas a ver un código tipo `join early-octopus`. Desde tu WhatsApp personal mandá ese mensaje al `+1 415 523 8886`. Twilio te confirma "✅ You are all set!".

**Paso 5 — vincular tu número real al comercio:**

```powershell
# Reemplazá +595... por tu número real
curl -X POST http://localhost:3000/v1/whatsapp/accounts `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"phone\":\"+595XXXXXXXXX\"}'
```

**Paso 6 — probar:**

Desde tu WhatsApp mandale al sandbox:

```
ayuda
```

Tendría que responderte el menú. Después:

```
cobro 50000 a Juan
```

Y vas a recibir el link al QR.

### 3.4 Diagnóstico

Si no recibís respuesta:

1. **Mirá los logs del backend** (terminal de `npm run dev`):
   - `[HTTP] POST /v1/whatsapp/webhook 200` → el webhook llegó.
   - `[WhatsAppSender]` con prefijo `[TWILIO]` → respuesta enviada.
   - `[WhatsAppSender]` con prefijo `[CONSOLE]` → faltan credenciales de Twilio en el `.env`.

2. **Verificá que el túnel responde**:
   ```powershell
   curl https://<tu-tunel>.trycloudflare.com/v1/health
   ```
   Debe devolver el JSON con `"status":"ok"`.

3. **Cerraste el `cloudflared`** → la URL deja de funcionar. Levantalo de nuevo y actualizá la URL en Twilio.

---

## 4. Resetear el entorno

Si querés volver a un estado limpio:

```powershell
# Mata el backend si está corriendo
# Borra DB y aplica migraciones desde cero
npx prisma migrate reset --force
npm run db:seed
```

Esto regenera los 5 usuarios precargados (demo, gerente, cajero, contador, admin) con el password de los defaults de dev y una API key nueva del Comercio Demo.


Comercio Demo (membership)
├── demo@cobrapy.test       OWNER     "Juan Demo"
├── gerente@cobrapy.test    ADMIN     "María Gerente"
├── cajero@cobrapy.test     OPERATOR  "Cajero del Tereré"
└── contador@cobrapy.test   READONLY  "Pedro Contador"
Staff portal (Admin model)
└── admin@cobrapy.test      SUPERADMIN "Super Admin"