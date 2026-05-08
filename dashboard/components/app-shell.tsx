'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { Icon } from './icon';
import { DarkModeToggle } from './dark-mode-toggle';
import { clearApiKey, getApiKey } from '@/lib/api';

interface AppShellProps {
  breadcrumb?: { section: string; current?: string };
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'dashboard' },
  { href: '/charges', label: 'Cobros', icon: 'payments' },
  { href: '/webhooks', label: 'Webhooks', icon: 'webhook' },
  { href: '/api-keys', label: 'API Keys', icon: 'vpn_key' },
  { href: '/settings', label: 'Configuración', icon: 'settings' },
  { href: 'http://localhost:3000/docs', label: 'Docs', icon: 'description', external: true },
];

export function AppShell({ breadcrumb, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const has = !!getApiKey();
    setAuthed(has);
    if (!has) router.replace('/');
  }, [router]);

  if (authed !== true) return null;

  function logout() {
    clearApiKey();
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="bg-surface-container-lowest h-screen w-64 flex-col border-r border-outline-variant shadow-sm hidden lg:flex fixed left-0 top-0 py-md z-50">
        <div className="px-lg mb-xl">
          <h1 className="font-h2 text-h2 font-bold text-primary">CobraPy</h1>
          <p className="font-body-sm text-body-sm tracking-wide text-on-surface-variant">Infraestructura Fintech</p>
        </div>
        <nav className="flex-1 px-sm space-y-unit overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = !item.external && isActive(item.href);
            const cls = active
              ? 'flex items-center gap-md px-md py-sm rounded-lg text-primary font-bold border-r-4 border-primary bg-surface-container transition-colors font-body-sm text-body-sm tracking-wide'
              : 'flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors font-body-sm text-body-sm tracking-wide';
            const inner = (
              <>
                <Icon name={item.icon} filled={active} />
                <span>{item.label}</span>
              </>
            );
            return item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>{inner}</Link>
            );
          })}
        </nav>
        <div className="px-md mt-auto pt-md border-t border-outline-variant">
          <Link href="/charges/new"
            className="w-full bg-primary-container text-on-primary-container py-md px-lg rounded-xl font-bold flex items-center justify-center gap-sm active:scale-95 transition-transform">
            <Icon name="add" />
            Nuevo Cobro
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* TopNav */}
        <header className="bg-surface-bright w-full h-16 flex items-center border-b border-outline-variant px-lg sticky top-0 z-40 justify-between">
          <div className="flex items-center gap-md">
            <button className="lg:hidden p-sm text-on-surface-variant" aria-label="Menu">
              <Icon name="menu" />
            </button>
            <div className="hidden lg:block">
              <span className="font-body-base text-body-base font-medium text-on-surface-variant">
                {breadcrumb?.section ?? 'Dashboard'}
                {breadcrumb?.current && (
                  <> / <span className="text-primary font-bold">{breadcrumb.current}</span></>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-lg">
            <span className="text-xs font-bold tracking-widest bg-tertiary-fixed text-on-tertiary-fixed-variant px-sm py-unit rounded">
              Environment: TEST
            </span>
            <DarkModeToggle />
            <div className="flex items-center gap-md border-l border-outline-variant pl-lg">
              <button onClick={logout} className="text-on-surface-variant hover:text-primary text-body-sm font-medium" aria-label="Salir">
                Salir
              </button>
              <Icon name="account_circle" className="text-4xl text-outline" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-lg max-w-7xl mx-auto w-full pb-32 lg:pb-lg">{children}</main>

        {/* Bottom nav (mobile only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 bg-surface-container-lowest border-t border-outline-variant shadow-lg h-16 z-50">
          {navItems.slice(0, 3).map((item) => {
            const active = !item.external && isActive(item.href);
            return item.external ? null : (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center ${active ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                <Icon name={item.icon} filled={active} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={logout} className="flex flex-col items-center justify-center text-on-surface-variant">
            <Icon name="menu" />
            <span className="text-[10px]">Más</span>
          </button>
        </nav>
      </div>
    </>
  );
}
