'use client';
import { useEffect, useState } from 'react';
import { apiFetch, type ApiKeyInfo } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setKeys(await apiFetch<ApiKeyInfo[]>('/merchants/me/api-keys'));
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <AppShell breadcrumb={{ section: 'Dashboard', current: 'API Keys' }}>
      <div className="mb-xl">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">API Keys</h1>
        <p className="text-on-surface-variant font-body-base">
          Las keys con prefijo <code className="font-data-mono text-[12px] bg-surface-container px-sm py-unit rounded">ck_test_</code> son del sandbox; las{' '}
          <code className="font-data-mono text-[12px] bg-surface-container px-sm py-unit rounded">ck_live_</code> mueven dinero real.
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md mb-lg flex items-start gap-md">
        <Icon name="info" className="text-primary mt-xs" />
        <p className="text-body-sm text-on-surface-variant">
          Por seguridad, después del onboarding inicial las keys completas no se vuelven a mostrar. Solo se ven los primeros caracteres del prefijo. Si perdiste tu key, creá una nueva (próxima iteración: endpoint <code className="font-data-mono">POST /merchants/me/api-keys</code>).
        </p>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading && <p className="p-xl text-center text-on-surface-variant">Cargando...</p>}
        {!loading && keys.length === 0 && (
          <p className="p-xl text-center text-on-surface-variant">Sin API keys registradas.</p>
        )}
        {keys.map((k) => {
          const masked = `${k.keyPrefix}••••••••••••••••••`;
          const isRevoked = !!k.revokedAt;
          return (
            <div key={k.id} className="px-lg py-md border-b border-outline-variant last:border-0 flex items-center justify-between gap-md">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm flex-wrap">
                  <p className="font-medium text-on-surface">{k.name}</p>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-sm py-unit rounded ${
                    k.environment === 'LIVE'
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                  }`}>{k.environment}</span>
                  {isRevoked && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-sm py-unit rounded bg-surface-container text-on-surface-variant">
                      Revocada
                    </span>
                  )}
                </div>
                <code className="font-data-mono text-body-sm text-on-surface-variant block mt-xs">{masked}</code>
                <p className="text-[11px] text-on-surface-variant mt-xs">
                  {k.lastUsedAt
                    ? `Última vez usada ${new Date(k.lastUsedAt).toLocaleString('es-PY')}`
                    : 'Nunca usada'}
                  {' · '}Creada {new Date(k.createdAt).toLocaleDateString('es-PY')}
                </p>
              </div>
              <button onClick={() => copy(k.keyPrefix, k.id)}
                className="text-on-surface-variant hover:text-primary p-sm rounded-lg transition" aria-label="Copiar prefijo">
                <Icon name={copied === k.id ? 'check' : 'content_copy'} />
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
