# CobraPy — Brief de Diseño para Stitch

> Este documento se puede pegar directo en Google Stitch como contexto para generar las pantallas de la plataforma. Está escrito en español, técnico pero accesible.

---

## 1. Producto en una línea

**CobraPy** es la infraestructura de cobros digital para Paraguay: una API + dashboard que permite a comercios aceptar pagos instantáneos vía QR sobre el SIP del Banco Central del Paraguay (el equivalente paraguayo de Pix de Brasil).

Posicionamiento: *"el Stripe de Paraguay"* — hecho por developers para developers, con foco en negocios pequeños y medianos.

---

## 2. Audiencia

Tres segmentos, en orden de prioridad:

1. **MiPyMEs digitales** — emprendedores con tienda online, profesionales independientes (médicos, abogados, contadores), e-commerce naciente. Conocen WhatsApp y Mercado Pago, no saben programar pero alguien de confianza les arma la integración.
2. **Comercios físicos** — restaurantes, kioscos, farmacias, peluquerías. Quieren reemplazar el POS con un QR fijo o dinámico.
3. **Marketplaces y plataformas** — apps de delivery, e-commerce multi-vendedor, SaaS B2B con cobros recurrentes. Equipo técnico real.

**Emociones que tiene que generar el dashboard**: confianza (es plata), claridad (saber al instante si entró un pago), tranquilidad (controlo todo desde mi celular).

---

## 3. Identidad visual

### Paleta

- **Primario**: verde guaraní `#0a7d3a` (verde profundo, evoca confianza y la bandera paraguaya sin gritarlo).
- **Secundario / hover**: `#10b981` (verde más vivo).
- **Éxito (pago acreditado)**: `#10b981`.
- **Pendiente / esperando**: `#f59e0b` (ámbar).
- **Error / fallo**: `#dc2626`.
- **Fondos**: `#fafafa` (zinc-50) para body, blanco para cards.
- **Texto**: `#18181b` (zinc-900) primario, `#52525b` secundario.

### Tipografía

- **Sans**: Inter (UI), tamaño base 14-16px.
- **Mono** (números financieros, IDs, API keys): JetBrains Mono o IBM Plex Mono.

### Personalidad visual

- **Espacios generosos**: padding amplio, no apretar info.
- **Bordes suaves**: radius 8-12px en cards, 6px en inputs.
- **Sombras sutiles**: nada de neumorfismo. Card shadow = `0 1px 3px rgba(0,0,0,0.08)`.
- **Sin emojis decorativos**: solo iconos (Lucide). El producto maneja plata, no es Duolingo.
- **Datos primero**: en cualquier pantalla, los números importantes (monto, total, comisión) son los más grandes.
- **Inspiración**: Stripe (claridad), Linear (densidad), Mercado Pago Argentina (familiaridad regional).

---

## 4. Mapa de pantallas

### Onboarding (público, sin auth)

1. **Landing pública** — hero con "Cobrá con QR en Paraguay en 5 minutos", botón principal "Empezar gratis", sección de features (API, QR, dashboard, webhooks), pricing (Free / Pro / Enterprise), footer con docs.
2. **Crear cuenta** — formulario corto: nombre del comercio, RUC, email, teléfono. Después de submit, pantalla con la **API key generada** (formato `ck_test_...`) en un bloque copiable, advertencia "guardala, no se vuelve a mostrar".
3. **Login** — input simple para pegar la API key. Como alternativa rápida a OAuth/email-password mientras el producto es B2B-developer-first.

### Dashboard autenticado

4. **Home / overview** — métricas del comercio:
   - Total cobrado en los últimos 30 días (en grande, monospace).
   - Cantidad de cobros (PAID / PENDING / FAILED).
   - Gráfico de línea: volumen diario últimas 4 semanas.
   - Lista de últimos 5 cobros con estado.
   - Cards de "próximas acciones": configurar webhook, agregar cuenta bancaria, generar API key de producción.

5. **Listado de cobros** — tabla con filtros (estado, rango de fechas, monto). Columnas: ID, monto, descripción, estado (badge coloreado), fecha. Click → detalle. Botón "+ Nuevo cobro" arriba.

6. **Crear cobro** — form mínimo: monto en Gs. (input grande, formato `Gs. 50.000` con máscara), descripción, externalId opcional. Botón "Generar QR". Aviso del límite SIP (Gs. 10.000.000).

7. **Detalle del cobro** — monto en grande arriba, badge de estado, **QR centrado** (300x300px) en card con borde sutil, instrucciones cortas debajo ("Escaneá con tu app del banco"). Cuando el estado es PAID muestra una franja verde con checkmark. Metadata abajo en mono pequeño (ID, timestamps, expiración). Si está PAID, mostrar comprobante descargable PDF.

8. **Webhooks** — listado de endpoints, columna URL, eventos suscriptos como tags, estado (activo/pausado). Botón "+ Agregar". Vista de drawer al click muestra: últimas 20 deliveries con status code, latencia, payload preview. Permite "reintentar" un delivery fallido.

9. **API keys** — lista de keys con: nombre, prefijo visible (ck_test_...), entorno (TEST/LIVE), última vez usada, botón "revocar". Al crear una nueva muestra el secret completo UNA SOLA VEZ en un modal con fondo oscuro y warning amarillo.

10. **Configuración del comercio** — datos del RUC, email, teléfono, cuenta bancaria destino. Estado KYC (PENDING/IN_REVIEW/APPROVED/REJECTED). Plan actual + CTA para upgrade.

### Pantallas técnicas

11. **Documentación / playground** (lateral o ruta `/docs`) — link a Swagger UI (`/docs` del API), snippets de código en Node, Python, cURL para los endpoints principales (crear cobro, listar, webhook signature).

### Mobile

Todas las pantallas tienen que ser usables en mobile. El dashboard de comercio en celular es **el caso de uso real más frecuente** (un dueño de cafetería abre desde el celular para ver si entró el cobro). Priorizar ahí:
- Bottom navigation con 4 tabs: Home, Cobros, Webhooks, Más.
- "Nuevo cobro" como FAB (floating action button) verde primario.
- Listado de cobros con cards en lugar de tabla.

---

## 5. Componentes clave a definir

| Componente | Detalles |
|---|---|
| **Badge de estado** | PAID = verde sólido / PENDING = ámbar suave / FAILED = rojo claro / EXPIRED = gris. Letras pequeñas, uppercase, padding 6x10. |
| **Monto** | Siempre con prefijo `Gs.` y separador de miles con punto (`Gs. 1.500.000`). Mono font cuando es dato; sans cuando es título grande. |
| **Card de cobro (mobile)** | Header con monto + badge a la derecha, descripción debajo, fecha pequeña. Tap completo = ir a detalle. |
| **Bloque copiable** | Para API keys, webhook secrets, IDs. Fondo gris suave, mono font, ícono copiar a la derecha, tooltip "Copiado" al click. |
| **QR card** | Card blanca, padding 32px, QR 300x300, debajo: monto grande + descripción + countdown de expiración. Estado overlay verde/rojo cuando ya no está PENDING. |
| **Empty state** | Ilustración minimal, mensaje corto, CTA verde primario. Ej: lista vacía de cobros → "Todavía no creaste ningún cobro. Empezá generando tu primer QR." |
| **Toast de éxito/error** | Top-right, 4 segundos, ícono + texto. Verde para éxito, rojo para error. |
| **Loading skeleton** | Shimmer suave en cards y tablas mientras carga. Nada de spinners infinitos. |

---

## 6. Tono de voz

- **Conversacional pero profesional**. Tutear ("vos podés cobrar..."), no "usted".
- **Cero jerga financiera innecesaria**. "Cobro" mejor que "transacción"; "comisión" mejor que "fee".
- **Claro sobre la plata**. Si el comercio cobra Gs. 50.000 y la comisión es Gs. 250, mostrar siempre los tres números: bruto / comisión / neto.
- **Honesto en errores**. "El pago todavía no se confirmó" mejor que "Procesando, esperá...".

---

## 7. Restricciones técnicas

- Stack: **Next.js 16 + React 19 + TailwindCSS 3 + shadcn/ui** (los componentes deben ser compatibles).
- Mobile first.
- Accesibilidad: contraste WCAG AA mínimo, focus rings visibles, labels en todos los inputs, navegación por teclado.
- Internacionalización: español (paraguayo) por default. No usar modismos argentinos ni mexicanos.

---

## 8. Lo que NO queremos

- ❌ Gradientes neón, glassmorphism, fondos animados de partículas.
- ❌ Iconos infantiles, emojis decorativos en la UI.
- ❌ Marketing copy en el dashboard ("¡Felicitaciones! ¡Lograste tu primer cobro!" — no, decir "Primer cobro acreditado: Gs. 50.000").
- ❌ Modales que tapan toda la pantalla cuando un drawer lateral alcanza.
- ❌ Tablas con scroll horizontal en mobile — usar cards.

---

# Prompt directo para pegar en Stitch

> Diseñá el dashboard web y mobile de **CobraPy**, una plataforma fintech de Paraguay que permite a comercios cobrar con QR sobre el SIP del Banco Central. Audiencia: MiPyMEs y emprendedores con tienda online o física. Tono: confiable, claro, datos primero.
>
> Identidad: verde guaraní `#0a7d3a` como primario, paleta zinc neutra, tipografía Inter para UI y JetBrains Mono para números/IDs, bordes redondeados 8-12px, sombras sutiles. Inspiración: Stripe + Linear + Mercado Pago.
>
> Generá las siguientes pantallas:
>
> 1. **Landing pública** — hero "Cobrá con QR en Paraguay en 5 minutos", CTA verde, sección de features, pricing 3 tiers (Free / Pro USD 29 / Enterprise USD 149), footer.
> 2. **Onboarding signup** — form: nombre comercio, RUC, email, teléfono.
> 3. **Pantalla de API key** — bloque grande copiable con fondo gris, warning amarillo "guardala, no se vuelve a mostrar", botón "Continuar al dashboard".
> 4. **Dashboard home** — métricas del mes (total cobrado en mono grande, cantidad de cobros, gráfico de línea de los últimos 30 días), tabla de últimos 5 cobros, cards de "próximas acciones".
> 5. **Listado de cobros** — tabla con columnas ID / monto / descripción / estado (badges coloreados PAID verde, PENDING ámbar, FAILED rojo) / fecha. Filtros arriba. Botón "+ Nuevo cobro" verde primario.
> 6. **Crear cobro** — form mínimo: monto en Gs. con máscara, descripción, externalId opcional. Aviso del límite SIP de Gs. 10.000.000.
> 7. **Detalle de cobro** — monto en grande arriba, QR centrado 300x300 en card blanca, instrucción "Escaneá con tu app del banco", countdown de expiración. Cuando está PAID, franja verde con checkmark y descarga de comprobante PDF.
> 8. **Webhooks** — lista de endpoints registrados, drawer lateral con últimas 20 deliveries (status code, latencia), botón "reintentar".
> 9. **API keys** — lista con prefijo visible, entorno TEST/LIVE, última vez usada, botón revocar. Modal de creación que muestra el secret una sola vez.
> 10. **Configuración** — datos del comercio, RUC, email, cuenta bancaria destino, estado KYC, plan actual.
>
> Versión mobile: bottom nav con 4 tabs (Home, Cobros, Webhooks, Más), FAB verde "+" para nuevo cobro, listados con cards en vez de tablas, QR ocupa todo el ancho menos padding.
>
> Componentes a definir:
>
> - Badge de estado (PAID / PENDING / FAILED / EXPIRED).
> - Monto siempre con formato "Gs. 1.500.000".
> - Bloque copiable con ícono copiar para API keys, secrets, IDs.
> - Empty state con ilustración minimal y CTA.
> - Loading skeleton con shimmer.
> - Toast top-right verde/rojo.
>
> No incluir: gradientes neón, glassmorphism, emojis decorativos, copy marketing dentro del dashboard. Stack target: Next.js + Tailwind + shadcn/ui. Mobile-first, WCAG AA.
