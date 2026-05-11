'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icon';

function ApiKeyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);
  const apiKey = params.get('key') ?? '';

  useEffect(() => {
    if (!apiKey) router.replace('/');
  }, [apiKey, router]);

  async function copy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-h2 text-h2 font-bold text-primary">CobraPy</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Onboarding</p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-lg flex flex-col gap-lg">
        <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
          <Icon name="check_circle" filled className="text-secondary" />
          <span>Cuenta creada</span>
          <span className="text-outline">›</span>
          <span className="text-primary font-semibold">API Key</span>
          <span className="text-outline">›</span>
          <span>Dashboard</span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-lg border-b border-outline-variant">
            <h2 className="font-h2 text-h2 text-on-surface mb-xs">Tu API Key (Test Mode)</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Esta key te permite crear cobros desde tu backend. Es secreta — tratala como una contraseña.
            </p>
          </div>

          <div className="p-lg flex items-center gap-md mb-md">
            <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">Tu API Key (Test Mode)</span>
            <span className="px-sm py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wider rounded">Secreta</span>
          </div>

          <div className="px-lg pb-lg">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-md bg-inverse-surface rounded-lg p-lg border border-outline">
              <code className="flex-1 font-api-snippet text-api-snippet text-primary-fixed break-all tracking-wider">
                {apiKey}
              </code>
              <button onClick={copy}
                className="flex items-center justify-center gap-sm bg-surface-variant/20 hover:bg-surface-variant/40 text-primary-fixed-dim px-md py-sm rounded-lg transition-colors border border-primary-fixed-dim/20 font-body-sm text-body-sm group whitespace-nowrap">
                <Icon name={copied ? 'check' : 'content_copy'} className="text-md group-active:scale-90 transition-transform" />
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="px-lg py-md bg-error-container/10 border-t border-outline-variant flex gap-md items-start">
            <Icon name="warning" className="text-error" />
            <div className="space-y-unit">
              <p className="font-body-sm text-body-sm font-semibold text-on-surface">Aviso importante</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Guardá tu API key en un lugar seguro. Por seguridad,{' '}
                <span className="font-bold">no se volverá a mostrar completa</span> una vez que salgas de esta pantalla.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="p-lg bg-surface-container rounded-xl border border-outline-variant flex items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center shrink-0">
              <Icon name="description" className="text-primary" />
            </div>
            <div>
              <h3 className="font-body-sm text-body-sm font-bold">Documentación</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Abrí Swagger en /docs
                </a>
              </p>
            </div>
          </div>
          <div className="p-lg bg-surface-container rounded-xl border border-outline-variant flex items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center shrink-0">
              <Icon name="webhook" className="text-primary" />
            </div>
            <div>
              <h3 className="font-body-sm text-body-sm font-bold">Webhooks</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Notificaciones en tiempo real cuando entra un pago.</p>
            </div>
          </div>
        </div>

        <button onClick={() => router.push('/charges')}
          className="w-full bg-primary text-on-primary py-lg rounded-xl font-h3 text-h3 hover:bg-primary-container transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-md">
          Continuar al Dashboard
          <Icon name="arrow_forward" />
        </button>
      </main>
    </div>
  );
}

export default function ApiKeyPage() {
  return (
    <Suspense>
      <ApiKeyContent />
    </Suspense>
  );
}
