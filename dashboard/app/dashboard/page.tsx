'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

interface Charge {
  id: string;
  amountGs: number;
  status: string;
  createdAt: string;
  description: string | null;
}

interface PaymentLink {
  id: string;
  slug: string;
  title: string | null;
  amountGs: number | null;
  usesCount: number;
}

function formatAmount(amount: number) {
  return `Gs. ${amount.toLocaleString('es-PY')}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer, ${date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PAID: 'bg-primary-fixed text-on-primary-fixed-variant',
    PENDING: 'bg-secondary-container text-on-secondary-container',
    EXPIRED: 'bg-surface-container-highest text-on-surface-variant',
    FAILED: 'bg-error-container text-on-error-container',
    CANCELED: 'bg-surface-container-highest text-on-surface-variant',
  };
  const labels: Record<string, string> = {
    PAID: 'Pagado',
    PENDING: 'Pendiente',
    EXPIRED: 'Expirado',
    FAILED: 'Fallido',
    CANCELED: 'Cancelado',
  };
  const style = styles[status] || 'bg-surface-container text-on-surface-variant';
  const label = labels[status] || status;
  return { style, label };
}

export default function DashboardPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30D' | '90D'>('30D');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const key = localStorage.getItem('cobrapy_api_key');
      const headers = { Authorization: `Bearer ${key}` };

      const [chargesRes, linksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges?limit=20`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links`, { headers }),
      ]);

      if (chargesRes.ok) {
        const data = await chargesRes.json();
        setCharges(data);
      }
      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalCobrado = charges
    .filter(c => c.status === 'PAID')
    .reduce((acc, c) => acc + c.amountGs, 0);

  const ventasDelMes = charges.filter(c => c.status === 'PAID').length;
  const conversion = charges.length > 0 
    ? Math.round((charges.filter(c => c.status === 'PAID').length / charges.length) * 100 * 10) / 10 
    : 0;

  const popularLinks = [...links]
    .sort((a, b) => b.usesCount - a.usesCount)
    .slice(0, 3);

  const totalLinkRevenue = links.reduce((acc, l) => acc + (l.amountGs || 0) * l.usesCount, 0);

  const recentCharges = charges.slice(0, 5);

  const mockChartData = Array.from({ length: 30 }, (_, i) => {
    const base = Math.random() * 0.6 + 0.4;
    const day = 30 - i;
    return { day: `Día ${day}`, height: `${Math.round(base * 100)}%` };
  }).reverse();

  return (
    <AppShell breadcrumb={{ section: 'Dashboard', current: 'Home' }}>
      <div className="max-w-7xl mx-auto space-y-lg">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm flex flex-col justify-between overflow-hidden relative border border-outline-variant/50">
            <div>
              <p className="text-body-sm font-medium text-on-surface-variant mb-xs">Total Cobrado</p>
              <h2 className="text-h1 text-on-surface">{formatAmount(totalCobrado)}</h2>
              <div className="flex items-center text-primary font-medium text-body-sm mt-xs">
                <Icon name="trending_up" className="text-sm mr-xs" />
                +12.4% vs mes anterior
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Icon name="account_balance_wallet" className="text-[80px]" />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm flex flex-col justify-between overflow-hidden relative border border-outline-variant/50">
            <div>
              <p className="text-body-sm font-medium text-on-surface-variant mb-xs">Ventas del Mes</p>
              <h2 className="text-h1 text-on-surface">{ventasDelMes}</h2>
              <div className="flex items-center text-primary font-medium text-body-sm mt-xs">
                <Icon name="show_chart" className="text-sm mr-xs" />
                +8.1% vs mes anterior
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Icon name="shopping_cart" className="text-[80px]" />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm flex flex-col justify-between overflow-hidden relative border border-outline-variant/50">
            <div>
              <p className="text-body-sm font-medium text-on-surface-variant mb-xs">Tasa de Conversión</p>
              <h2 className="text-h1 text-on-surface">{conversion}%</h2>
              <div className="flex items-center text-primary font-medium text-body-sm mt-xs">
                <Icon name="check_circle" className="text-sm mr-xs" />
                Alta eficiencia transaccional
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Icon name="speed" className="text-[80px]" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-lg">
          <div className="xl:col-span-3 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex justify-between items-center mb-lg">
              <div>
                <h3 className="text-h3 text-on-surface">Volumen de Cobros (30 días)</h3>
                <p className="text-body-sm text-on-surface-variant">Visualización de liquidez diaria en Guaraníes</p>
              </div>
              <div className="flex bg-surface-container rounded-lg p-xs">
                <button 
                  onClick={() => setPeriod('30D')}
                  className={`px-md py-xs text-body-sm font-medium rounded ${period === '30D' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'}`}
                >
                  30D
                </button>
                <button 
                  onClick={() => setPeriod('90D')}
                  className={`px-md py-xs text-body-sm font-medium rounded ${period === '90D' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'}`}
                >
                  90D
                </button>
              </div>
            </div>

            <div className="relative h-64 w-full bg-gradient-to-t from-surface-container-low to-transparent rounded-lg flex items-end px-md gap-xs">
              <div className="absolute inset-0 flex flex-col justify-between py-md pointer-events-none">
                <div className="border-t border-outline-variant w-full h-0 opacity-40"></div>
                <div className="border-t border-outline-variant w-full h-0 opacity-40"></div>
                <div className="border-t border-outline-variant w-full h-0 opacity-40"></div>
                <div className="border-t border-outline-variant w-full h-0 opacity-40"></div>
              </div>
              {mockChartData.map((d, i) => (
                <div 
                  key={i}
                  className="w-full bg-primary-container rounded-t opacity-60"
                  style={{ height: d.height }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-md px-md text-[10px] text-outline font-medium">
              <span>01 MAY</span>
              <span>08 MAY</span>
              <span>15 MAY</span>
              <span>22 MAY</span>
              <span>30 MAY</span>
            </div>
          </div>

          <div className="xl:col-span-1 bg-surface-container-lowest p-lg rounded-xl shadow-sm border-l-4 border-primary-container">
            <h3 className="text-h3 text-on-surface mb-sm">Próximos Pasos</h3>
            <p className="text-body-sm text-on-surface-variant mb-lg">Completa tu perfil para habilitar cobros superiores a Gs. 100M.</p>
            <div className="space-y-md">
              <div className="flex items-start gap-md">
                <div className="p-xs bg-primary-container text-on-primary-container rounded-full shrink-0">
                  <Icon name="check" className="text-sm" style={{ fontVariationSettings: "'FILL' 1" }} />
                </div>
                <div className="text-body-sm">
                  <p className="font-bold text-on-surface">Vincular cuenta bancaria</p>
                  <p className="text-[12px] text-on-surface-variant">Para transferencias SIPAP</p>
                </div>
              </div>
              <div className="flex items-start gap-md opacity-60">
                <div className="p-xs bg-surface-container text-on-surface-variant rounded-full shrink-0 border border-outline-variant">
                  <Icon name="circle" className="text-sm" />
                </div>
                <div className="text-body-sm">
                  <p className="font-bold text-on-surface">Cargar RUC y SET (90%)</p>
                  <p className="text-[12px] text-on-surface-variant">Validación de personería</p>
                </div>
              </div>
              <div className="flex items-start gap-md opacity-60">
                <div className="p-xs bg-surface-container text-on-surface-variant rounded-full shrink-0 border border-outline-variant">
                  <Icon name="circle" className="text-sm" />
                </div>
                <div className="text-body-sm">
                  <p className="font-bold text-on-surface">Configurar Webhooks</p>
                  <p className="text-[12px] text-on-surface-variant">Notificaciones en tiempo real</p>
                </div>
              </div>
            </div>
            <button className="mt-xl w-full py-sm bg-surface-container text-primary font-bold rounded-lg text-body-sm hover:bg-surface-container-high transition-colors">
              Continuar Configuración
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
          <div className="xl:col-span-1 space-y-md">
            <h3 className="text-h3 text-on-surface">Links de Pago Populares</h3>
            
            {popularLinks.length === 0 ? (
              <div className="bg-surface-container-lowest p-md rounded-lg text-center">
                <Icon name="link" className="text-4xl text-on-surface-variant mb-md" />
                <p className="text-body-sm text-on-surface-variant">No hay links creados</p>
                <a href="/payment-links" className="text-primary font-bold text-body-sm">Crear link</a>
              </div>
            ) : (
              popularLinks.map((link) => (
                <div key={link.id} className="bg-surface-container-lowest p-md rounded-lg flex items-center justify-between group cursor-pointer hover:border-primary border border-transparent transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-body-sm">{link.title || 'Sin título'}</span>
                    <span className="text-primary font-mono text-[12px]">cobra.py/p/{link.slug}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-body-sm text-on-surface">{formatAmount((link.amountGs || 0) * link.usesCount)}</span>
                    <div className="flex items-center justify-end text-[10px] text-on-surface-variant uppercase tracking-tighter">
                      <Icon name="ads_click" className="text-[10px] mr-xs" /> {link.usesCount} clicks
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <a href="/payment-links" className="w-full text-center py-xs text-primary font-bold text-body-sm hover:underline">
              Ver todos los links
            </a>
          </div>

          <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-h3 text-on-surface">Últimos cobros</h3>
              <a href="/charges" className="text-body-sm text-primary font-bold flex items-center">
                Ver historial <Icon name="arrow_forward" className="ml-xs text-sm" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-lg py-md">ID Transacción</th>
                    <th className="px-lg py-md">Descripción</th>
                    <th className="px-lg py-md">Fecha</th>
                    <th className="px-lg py-md text-right">Monto</th>
                    <th className="px-lg py-md text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-lg py-md text-center text-on-surface-variant">Cargando...</td>
                    </tr>
                  ) : recentCharges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-lg py-md text-center text-on-surface-variant">No hay transacciones</td>
                    </tr>
                  ) : (
                    recentCharges.map((charge) => {
                      const { style, label } = getStatusBadge(charge.status);
                      return (
                        <tr key={charge.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-lg py-md font-mono text-body-sm">{charge.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-lg py-md font-medium text-on-surface">{charge.description || '—'}</td>
                          <td className="px-lg py-md text-body-sm text-on-surface-variant">{formatDate(charge.createdAt)}</td>
                          <td className="px-lg py-md text-right font-mono text-body-sm">{formatAmount(charge.amountGs)}</td>
                          <td className="px-lg py-md text-center">
                            <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase ${style}`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}