'use client';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-lg py-md border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex flex-col">
            <span className="font-h2 text-h2 font-bold text-primary">CobraPy</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Infraestructura Fintech</span>
          </Link>
          <nav className="hidden md:flex items-center gap-lg">
            <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-on-surface-variant hover:text-primary transition-colors">Pricing</a>
            <a href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-sm">
            <Link href="/login" className="text-on-surface-variant hover:text-primary px-md py-sm font-medium text-body-sm">Ingresar</Link>
            <Link href="/signup" className="bg-primary text-on-primary px-md py-sm rounded-lg font-bold text-body-sm hover:bg-primary-container transition">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-lg w-full">
        {/* Hero */}
        <section className="py-xl lg:py-[100px] flex flex-col lg:flex-row items-center gap-xl">
          <div className="flex-1 space-y-lg text-center lg:text-left">
            <div className="inline-flex items-center px-md py-sm rounded-full bg-secondary-container text-on-secondary-container font-body-sm font-semibold">
              <Icon name="qr_code_scanner" filled className="mr-sm" />
              QR Hub interoperable activo en SIP
            </div>
            <h1 className="font-h1 text-[48px] lg:text-[64px] leading-tight font-extrabold text-on-surface">
              Cobrá con QR en Paraguay en <span className="text-primary">5 minutos</span>
            </h1>
            <p className="font-body-base text-body-base text-on-surface-variant max-w-xl mx-auto lg:mx-0">
              La infraestructura de pagos para MiPyMEs y desarrolladores. Simple, rápida y segura sobre el{' '}
              <span className="font-semibold">SIP del BCP</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-md justify-center lg:justify-start">
              <Link href="/signup" className="bg-primary hover:bg-primary-container text-on-primary px-xl py-md rounded-lg font-bold text-body-base transition-all active:scale-95 shadow-sm">
                Empezar gratis
              </Link>
              <a href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer"
                className="bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface px-xl py-md rounded-lg font-bold text-body-base transition-all">
                Ver documentación
              </a>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-xl border border-outline-variant">
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-secondary-container/30 to-tertiary-fixed/20 flex items-center justify-center p-xl">
                <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-xl flex flex-col items-center gap-md">
                  <div className="w-32 h-32 bg-inverse-surface rounded-xl flex items-center justify-center">
                    <Icon name="qr_code_2" className="text-primary-fixed-dim text-[88px]" />
                  </div>
                  <p className="font-data-mono text-h3 text-primary">Gs. 50.000</p>
                </div>
              </div>
              <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-t border-outline-variant">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                    <Icon name="check_circle" filled className="text-on-primary-fixed" />
                  </div>
                  <div>
                    <p className="font-data-mono text-[12px] text-on-surface-variant uppercase tracking-widest">Liquidación</p>
                    <p className="font-bold text-primary">Acreditado en 2 segundos</p>
                  </div>
                </div>
                <span className="font-data-mono text-body-sm text-on-surface-variant hidden sm:inline">SIP-REF: 90210</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-xl">
          <div className="mb-xl text-center">
            <h2 className="font-h2 text-h2 text-on-surface mb-sm">Diseñado para la eficiencia</h2>
            <p className="font-body-base text-on-surface-variant">Herramientas de nivel bancario para el mercado local.</p>
          </div>
          <div className="grid grid-cols-12 gap-lg">
            <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between min-h-[320px]">
              <div>
                <FeatureIcon icon="api" tone="primary-fixed-dim" />
                <h3 className="font-h3 text-h3 text-on-surface mb-sm">API robusta</h3>
                <p className="font-body-sm text-on-surface-variant mb-md">Integración en pocas líneas. SDKs para Node y Python con soporte directo para SIP 24/7.</p>
              </div>
              <div className="bg-inverse-surface rounded-lg p-md overflow-x-auto">
                <pre className="font-api-snippet text-on-primary-container text-[13px] leading-relaxed">
<code><span className="text-primary-fixed-dim">POST</span> /v1/charges
{`{
  "amountGs": 50000,
  "description": "Almuerzo",
  "externalId": "order-001"
}`}</code></pre>
              </div>
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
              <FeatureIcon icon="qr_code_2" tone="secondary-container" textColor="on-secondary-container" />
              <h3 className="font-h3 text-h3 text-on-surface mb-sm">QR Dinámico</h3>
              <p className="font-body-sm text-on-surface-variant">Un QR único por transacción. Conciliación automática y zero ambigüedad.</p>
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
              <FeatureIcon icon="dashboard_customize" tone="surface-container-high" textColor="on-surface-variant" />
              <h3 className="font-h3 text-h3 text-on-surface mb-sm">Dashboard real-time</h3>
              <p className="font-body-sm text-on-surface-variant">Métricas y estado de cobros al instante.</p>
            </div>
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-lg">
              <div className="flex-1">
                <FeatureIcon icon="webhook" tone="tertiary-fixed" textColor="tertiary" />
                <h3 className="font-h3 text-h3 text-on-surface mb-sm">Webhooks</h3>
                <p className="font-body-sm text-on-surface-variant">Notificaciones instantáneas con HMAC-SHA256, reintentos exponenciales y tracking completo de deliveries.</p>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-surface-container rounded-xl p-lg">
                  <code className="font-api-snippet text-[12px] text-on-surface-variant block">CobraPy-Signature: t=...</code>
                  <code className="font-api-snippet text-[12px] text-on-surface-variant block">CobraPy-Event: charge.paid</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-xl">
          <div className="mb-xl text-center">
            <h2 className="font-h2 text-h2 text-on-surface mb-sm">Planes que crecen con vos</h2>
            <p className="font-body-base text-on-surface-variant">Sin costos ocultos, transparencia total.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <PriceCard plan="Free" price="0%" suffix="comisión fija" desc="Ideal para validar tu MVP."
              features={['Hasta 50 transacciones/mes', 'API access', 'Dashboard básico']} cta="Elegir Free" />
            <PriceCard featured plan="Pro" price="USD 29" suffix="/mes" desc="Para MiPyMEs con volumen constante."
              features={['Transacciones ilimitadas', 'Webhooks avanzados', 'Soporte prioritario', 'Logo personalizado en QR']} cta="Empezar Pro" />
            <PriceCard plan="Enterprise" price="USD 149" suffix="/mes" desc="Para grandes plataformas y financieras."
              features={['Multi-cuenta y roles', 'SLA garantizado', 'Conciliación bancaria directa']} cta="Contactar Ventas" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-xl">
          <div className="bg-primary p-xl lg:p-[64px] rounded-2xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-md">
              <h2 className="font-h2 text-[32px] text-on-primary max-w-2xl mx-auto">
                ¿Listo para transformar tu forma de cobrar en Paraguay?
              </h2>
              <p className="text-on-primary-container font-body-base max-w-xl mx-auto opacity-90">
                Integrá CobraPy hoy y aceptá pagos QR de cualquier banco o billetera del país.
              </p>
              <div className="pt-md">
                <Link href="/signup"
                  className="inline-block bg-on-primary text-primary px-xl py-md rounded-lg font-bold text-body-base hover:bg-primary-fixed transition-all active:scale-95">
                  Crear cuenta gratuita
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-xl bg-surface-container-highest border-t border-outline-variant mt-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-lg gap-md">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-h3 text-h3 font-bold text-primary mb-xs">CobraPy</span>
            <p className="font-body-sm text-on-surface-variant">© 2026 CobraPy. Infraestructura Fintech para Paraguay.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-md font-body-sm text-on-surface-variant">
            <a className="hover:text-primary hover:underline transition" href="#">Términos</a>
            <a className="hover:text-primary hover:underline transition" href="#">Privacidad</a>
            <a className="hover:text-primary hover:underline transition" href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer">Documentación</a>
            <a className="hover:text-primary hover:underline transition" href="#">Soporte</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureIcon({ icon, tone, textColor = 'primary' }: { icon: string; tone: string; textColor?: string }) {
  return (
    <div className={`w-12 h-12 rounded-lg bg-${tone} flex items-center justify-center mb-md`}>
      <span className={`material-symbols-outlined text-${textColor}`}>{icon}</span>
    </div>
  );
}

function PriceCard({ plan, price, suffix, desc, features, cta, featured }: {
  plan: string; price: string; suffix: string; desc: string; features: string[]; cta: string; featured?: boolean;
}) {
  const cls = featured
    ? 'bg-surface-container-lowest p-xl rounded-xl border-2 border-primary flex flex-col h-full shadow-lg relative lg:scale-105'
    : 'bg-surface-container-lowest p-xl rounded-xl border border-outline-variant flex flex-col h-full shadow-sm';
  return (
    <div className={cls}>
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-md py-xs rounded-full text-[12px] font-bold uppercase tracking-wider">
          Más Popular
        </div>
      )}
      <div className="mb-lg">
        <h4 className={`font-bold uppercase tracking-widest text-[12px] mb-xs ${featured ? 'text-primary' : 'text-on-surface-variant'}`}>{plan}</h4>
        <div className="flex items-baseline gap-xs">
          <span className="font-h1 text-[40px] text-on-surface">{price}</span>
          <span className="font-body-sm text-on-surface-variant">{suffix}</span>
        </div>
        <p className="font-body-sm text-on-surface-variant mt-sm">{desc}</p>
      </div>
      <ul className="space-y-sm flex-1 mb-xl">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-sm font-body-sm text-on-surface">
            <Icon name="check" className="text-primary text-[18px]" />
            {f}
          </li>
        ))}
      </ul>
      <button className={featured
        ? 'w-full bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition-all'
        : 'w-full border border-outline text-on-surface font-bold py-md rounded-lg hover:bg-surface-container transition-all'}>
        {cta}
      </button>
    </div>
  );
}
