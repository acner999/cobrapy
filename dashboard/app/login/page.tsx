'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setApiKey, getApiKey } from '@/lib/api';
import { Icon } from '@/components/icon';

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKeyInput] = useState('');

  useEffect(() => {
    if (getApiKey()) router.replace('/charges');
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiKey(apiKey);
    router.push('/charges');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="font-h2 text-h2 font-bold text-primary">CobraPy</Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-lg">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-xl">
          <div className="mb-xl">
            <h2 className="font-h1 text-h1 text-on-surface mb-xs">Ingresar</h2>
            <p className="font-body-sm text-on-surface-variant">Pegá tu API key para acceder al dashboard.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="key" className="font-body-sm font-medium text-on-surface">API Key</label>
              <div className="relative">
                <Icon name="vpn_key" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input id="key" type="text" value={apiKey} onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="ck_test_..." required
                  className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-data-mono text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <button type="submit"
              className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98]">
              Ingresar
            </button>
          </form>
          <div className="mt-xl pt-lg border-t border-outline-variant text-center space-y-sm">
            <p className="font-body-sm text-on-surface-variant">
              ¿Sos nuevo? <Link href="/signup" className="text-primary font-semibold hover:underline">Crear cuenta</Link>
            </p>
            <p className="font-body-sm text-on-surface-variant">
              <Link href="/admin/login" className="text-tertiary hover:underline text-[12px]">Acceso staff CobraPy →</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
