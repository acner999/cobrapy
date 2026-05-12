'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/icon';

interface ChargeData {
  id: string;
  amountGs: number;
  description: string | null;
  status: string;
  qrImageUrl: string | null;
  qrPayload: string | null;
  expiresAt: string | null;
  merchant: { businessName: string };
}

export default function PayChargePage() {
  const { id } = useParams<{ id: string }>();
  const [charge, setCharge] = useState<ChargeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setCharge(data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!charge?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(charge.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setCountdown('EXPIRADO'); clearInterval(interval); return; }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [charge]);

  const bg  = darkMode ? 'bg-zinc-950' : 'bg-surface';
  const card = darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100';
  const txt  = darkMode ? 'text-zinc-100' : 'text-slate-900';
  const sub  = darkMode ? 'text-zinc-400' : 'text-slate-500';

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  const expired  = charge?.expiresAt && new Date(charge.expiresAt) < new Date();
  const unavailable = !charge || charge.status === 'EXPIRED' || charge.status === 'PAID' || charge.status === 'CANCELED' || expired;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors ${bg}`}>
      <header className="text-center mb-10">
        <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-emerald-400' : 'text-primary'}`}>CobraPy</h1>
        <p className={`text-sm font-medium tracking-widest uppercase mt-1 ${sub}`}>Pago instantáneo vía SIP/BCP</p>
      </header>

      <main className={`w-full max-w-[420px] rounded-[2rem] border shadow-xl p-8 ${card}`}>
        {unavailable ? (
          <div className="text-center py-8">
            <Icon name="cancel" className={`text-5xl mb-4 ${sub}`} />
            <h2 className={`text-xl font-bold ${txt}`}>
              {charge?.status === 'PAID' ? 'Cobro ya pagado' : 'Link no disponible'}
            </h2>
            <p className={`mt-2 text-sm ${sub}`}>
              {charge?.status === 'PAID' ? 'Este cobro ya fue procesado.' : 'El link expiró o fue cancelado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${sub}`}>Pagando a</p>
              <h2 className={`text-2xl font-bold ${txt}`}>{charge!.merchant.businessName}</h2>
            </div>

            <div className={`h-px ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />

            {charge!.description && (
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${sub}`}>Concepto</p>
                <p className={`text-lg font-semibold ${txt}`}>{charge!.description}</p>
              </div>
            )}

            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${sub}`}>Monto</p>
              <p className={`text-5xl font-extrabold tracking-tighter ${darkMode ? 'text-emerald-400' : 'text-primary'}`}>
                Gs. {charge!.amountGs.toLocaleString('es-PY')}
              </p>
            </div>

            <div className="flex justify-center py-2">
              {charge!.qrImageUrl ? (
                <img src={charge!.qrImageUrl} alt="QR de pago" className="w-60 h-60 rounded-xl" />
              ) : (
                <div className={`w-60 h-60 flex items-center justify-center rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <Icon name="qr_code_2" className={`text-6xl ${sub}`} />
                </div>
              )}
            </div>

            {countdown && (
              <div className={`text-center py-2 rounded-lg text-sm font-bold ${countdown === 'EXPIRADO' ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {countdown === 'EXPIRADO' ? 'Tiempo expirado' : `Vence en ${countdown}`}
              </div>
            )}

            <p className={`text-center text-xs ${sub}`}>Escaneá el QR con la app de tu banco</p>
          </div>
        )}
      </main>

      <footer className="mt-10 flex flex-col items-center gap-4">
        <p className={`text-sm ${sub}`}>
          Powered by <span className="font-bold">CobraPy</span> · Sistema de Pagos Instantáneos
        </p>
        <button onClick={() => setDarkMode(!darkMode)}
          className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white border-slate-200 text-slate-400'}`}>
          <Icon name={darkMode ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
        </button>
      </footer>
    </div>
  );
}
