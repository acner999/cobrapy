# CobraPy

API + Dashboard de cobros instantáneos para Paraguay sobre el SIP del BCP.

> **Cómo probar localmente** (usuarios precargados, bot de WhatsApp paso a paso, túnel con Cloudflare): ver [TESTING.md](TESTING.md).

## Estado

Funcional para desarrollo local. Sin conexión real al SIP todavía (se simula).

- [x] Backend NestJS con auth por API key
- [x] Schema completo (merchants, charges, transactions, ledger doble entrada, webhooks, audit)
- [x] Generador de QR EMVCo con CRC16
- [x] Webhooks con HMAC-SHA256 + reintentos exponenciales (BullMQ)
- [x] Endpoint admin para simular pagos del SIP
- [x] Dashboard Next.js (login, listado, nuevo cobro, ver QR, simular pago)
- [ ] Conexión real al sandbox del BCP (espera credenciales PISP)
- [ ] Conciliación automática diaria
- [ ] SDK Node y Python publicados

## Stack

| | |
|---|---|
| API | NestJS + TypeScript |
| DB | PostgreSQL 16 + Prisma |
| Cola | Redis + BullMQ |
| Dashboard | Next.js 15 + Tailwind |
| QR | EMVCo Merchant Presented Mode |

## Quickstart

Necesitás: Node 20+, Docker Desktop.

```powershell
cd C:\Repos\Personal\cobrapy

# Variables
copy .env.example .env

# Postgres y Redis
docker compose up -d

# Backend
npm install
npx prisma migrate dev --name init
npm run db:seed              # imprime una API key — guardala
npm run dev                  # http://localhost:3000/v1

# Dashboard (otra terminal)
cd dashboard
npm install
npm run dev                  # http://localhost:3001
```

## Flujo end-to-end de prueba

1. Abrí `http://localhost:3001`, modo "Crear cuenta", completá el form. Guarda la API key que aparece.
2. Click en "Nuevo cobro" → poné `50000` y descripción → "Generar QR".
3. Abrí los detalles del cobro → expandí "Simular pago" → pegá el `ADMIN_TOKEN` del `.env` → click. Esperá 3 segundos y la página se actualiza a `PAID`.

## Webhooks

Cuando un cobro se marca como pagado, CobraPy dispara `charge.paid` a todos los endpoints registrados.

```powershell
# Registrar webhook
curl -X POST http://localhost:3000/v1/webhooks `
  -H "Authorization: Bearer ck_test_..." `
  -H "Content-Type: application/json" `
  -d '{\"url\": \"https://webhook.site/abc-123\", \"events\": [\"charge.paid\"]}'
```

Headers que envía CobraPy:
- `CobraPy-Signature: t=<timestamp>,v1=<hmac-sha256>`
- `CobraPy-Event: charge.paid`

Verificación HMAC en el receptor (Node):
```ts
const expected = crypto.createHmac('sha256', secret)
  .update(`${timestamp}.${rawBody}`)
  .digest('hex');
```

Reintentos: 6 intentos con backoff exponencial (2s, 4s, 8s, 16s, 32s, 64s). Después → `ABANDONED`.

## Endpoints principales

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/v1/merchants` | público | Crear comercio + API key |
| GET | `/v1/merchants/me` | API key | Datos del comercio |
| GET | `/v1/merchants/me/api-keys` | API key | Listar API keys |
| POST | `/v1/charges` | API key | Crear cobro (genera QR) |
| GET | `/v1/charges` | API key | Listar cobros |
| GET | `/v1/charges/:id` | API key | Detalle de cobro |
| POST | `/v1/webhooks` | API key | Registrar endpoint webhook |
| GET | `/v1/webhooks` | API key | Listar webhooks |
| DELETE | `/v1/webhooks/:id` | API key | Eliminar webhook |
| POST | `/v1/admin/charges/:id/simulate-paid` | X-Admin-Token | Simular pago (dev only) |

## Estructura

```
cobrapy/
├── docker-compose.yml          # Postgres + Redis
├── prisma/
│   ├── schema.prisma           # modelo de datos
│   └── seed.ts                 # comercio demo
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/                   # API keys, guard, decorator
│   ├── merchants/              # onboarding y datos del comercio
│   ├── charges/                # cobros + QR EMVCo
│   ├── webhooks/               # endpoints, dispatcher, processor
│   ├── admin/                  # endpoints internos (simulate)
│   ├── prisma/                 # PrismaService global
│   └── common/queue.module.ts  # BullMQ root
└── dashboard/                  # Next.js 15 + Tailwind
    └── app/
        ├── page.tsx            # login / signup
        └── charges/
            ├── page.tsx        # listado
            ├── new/page.tsx    # crear
            └── [id]/page.tsx   # detalle + QR + simulate
```

## Notas regulatorias

CobraPy operará bajo la figura de **PISP (Payment Initiation Service Provider)** según la **Resolución 15/2025 del BCP**. En esta fase no custodia fondos: los pagos van directo banco-a-banco vía SIP. La figura de **EMPE (Resolución 6/2014)** se evaluará en Fase 3 cuando se sume billetera de consumidor.

## Roadmap inmediato

1. Setup legal + trámite ante BCP para habilitación PISP.
2. Conexión real al sandbox del SIP (cuando se obtengan credenciales).
3. Reemplazar GUI placeholder `py.gov.bcp.sip` con el oficial cuando el BCP publique la spec del QR Hub.
4. SDK Node y Python.
5. Documentación pública con Mintlify.
6. Beta cerrada con 5 comercios reales.
