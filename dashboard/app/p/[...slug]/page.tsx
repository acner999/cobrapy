'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';

interface PaymentLinkData {
  id: string;
  slug: string;
  title: string | null;
  amountGs: number | null;
  description: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  active: boolean;
  merchant: {
    businessName: string;
  };
}

interface ChargeData {
  id: string;
  qrImageUrl: string;
  qrPayload: string;
  expiresAt: string;
}

export default function PublicPaymentLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
  const step = searchParams.get('step');
  const amountParam = searchParams.get('amount');

  const [data, setData] = useState<PaymentLinkData | null>(null);
  const [charge, setCharge] = useState<ChargeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchLink();
    }
  }, [slug]);

  useEffect(() => {
    if (charge?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const exp = new Date(charge.expiresAt).getTime();
        const diff = exp - now;
        if (diff <= 0) {
          setCountdown('EXPIRADO');
          clearInterval(interval);
        } else {
          const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const sec = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [charge]);

  const fetchLink = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/p/${slug}`);
      const json = await res.json();
      if (json.error) {
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const initPayment = async (finalAmount: number) => {
    setLoading(true);
    try {
      const chargeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cobrapy_api_key') || ''}`,
        },
        body: JSON.stringify({
          amountGs: finalAmount,
          description: data?.title || data?.description || 'Pago via link',
          paymentType: 'QR_DYNAMIC',
        }),
      });

      if (chargeRes.ok) {
        const chargeJson = await chargeRes.json();
        setCharge(chargeJson);
        router.replace(`/p/${slug}?step=pay&amount=${finalAmount}`);
      } else {
        setError('Error al crear el cargo');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (!data?.amountGs && !amount) {
      setError('Ingresá un monto');
      return;
    }
    const finalAmount = data?.amountGs || parseInt(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Monto inválido');
      return;
    }
    initPayment(finalAmount);
  };

  const goBack = () => {
    router.push(`/p/${slug}`);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-dark-surface' : 'bg-surface'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      </div>
    );
  }

  const isExpired = data?.expiresAt && new Date(data.expiresAt) < new Date();
  const isMaxed = data?.maxUses && data.usesCount >= data.maxUses;
  const isPayStep = step === 'pay' && amountParam;

  if (isPayStep) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-dark-surface' : 'bg-surface'}`}>
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-emerald-500' : 'text-primary'}`}>
              CobraPy
            </h1>
          </div>
          <p className={`text-sm font-medium tracking-wide uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Escaneá el QR con tu banco
          </p>
        </header>

        <main className={`w-full max-w-[440px] rounded-[2.5rem] premium-shadow border p-10 transition-all duration-300 ${darkMode ? 'bg-zinc-900 border-zinc-800/50' : 'bg-white border-slate-100'}`}>
          <div className="space-y-8">
            <section>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Comercio</p>
              <h2 className={`text-2xl font-bold tracking-tight leading-none ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                {data?.merchant?.businessName}
              </h2>
            </section>

            <div className={`h-px w-full ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}></div>

            <div className="space-y-6">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Monto</p>
                <div className="flex items-center">
                  <span className={`text-5xl font-extrabold tracking-tighter ${darkMode ? 'text-emerald-500' : 'text-primary'}`}>
                    Gs. {parseInt(amountParam || '0').toLocaleString('es-PY')}
                  </span>
                </div>
              </div>

              {data?.title && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Concepto</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>{data.title}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center my-6">
              {charge?.qrImageUrl ? (
                <img src={charge.qrImageUrl} alt="QR Code" className="w-64 h-64" />
              ) : (
                <div className={`w-64 h-64 flex items-center justify-center ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <Icon name="qr_code_2" className={`text-6xl ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                </div>
              )}
            </div>

            {countdown && (
              <div className={`text-center py-3 rounded-lg ${countdown === 'EXPIRADO' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                <span className="font-bold">
                  {countdown === 'EXPIRADO' ? 'Tiempo expirado' : `Tiempo restante: ${countdown}`}
                </span>
              </div>
            )}

            <button
              onClick={goBack}
              className={`w-full py-5 text-center font-medium transition-colors text-lg ${darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon name="arrow_back" className="vertical-align-middle mr-2" />
              Volver
            </button>
          </div>
        </main>

        <footer className="mt-12 text-center">
          <button
            onClick={toggleDarkMode}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border premium-shadow ${darkMode ? 'bg-zinc-800 text-zinc-500 border-zinc-800' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <Icon name={darkMode ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-dark-surface' : 'bg-surface'}`}>
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-emerald-500' : 'text-primary'}`}>
            CobraPy
          </h1>
        </div>
        <p className={`text-sm font-medium tracking-wide uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Pago instantáneo vía SIP/BCP
        </p>
      </header>

      <main className={`w-full max-w-[440px] rounded-[2.5rem] premium-shadow border p-10 transition-all duration-300 ${darkMode ? 'bg-zinc-900 border-zinc-800/50' : 'bg-white border-slate-100'}`}>
        {(isExpired || isMaxed || !data?.active) ? (
          <div className="text-center py-8">
            <Icon name="cancel" className={`text-5xl mb-4 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
            <h2 className={`text-xl font-bold ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Link no disponible</h2>
            <p className={`mt-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
              {isExpired ? 'Este link de pago ha expirado' : isMaxed ? 'Se alcanzó el límite de usos' : 'Este link está inactivo'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Estas pagando a</p>
              <h2 className={`text-2xl font-bold tracking-tight leading-none ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                {data?.merchant?.businessName || 'Comercio'}
              </h2>
            </section>

            <div className={`h-px w-full ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}></div>

            <div className="space-y-6">
              {data?.title && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Concepto</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>{data.title}</p>
                </div>
              )}

              {data?.description && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Descripción</p>
                  <p className={`text-base font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>{data.description}</p>
                </div>
              )}

              <div className="pt-2">
                <p className={`text-xs font-bold uppercase tracking-widest block mb-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Monto a pagar</p>
                {data?.amountGs ? (
                  <div className="flex items-center">
                    <span className={`text-5xl font-extrabold tracking-tighter ${darkMode ? 'text-emerald-500' : 'text-primary'}`}>
                      Gs. {data.amountGs.toLocaleString('es-PY')}
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setError(''); }}
                      placeholder="Ingresá el monto"
                      className={`w-full text-2xl font-bold text-center p-4 border-2 rounded-2xl focus:outline-none transition-colors ${darkMode ? 'border-zinc-700 bg-zinc-800 text-zinc-100 focus:border-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-primary'}`}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button
                onClick={handlePay}
                className={`w-full font-bold py-6 px-8 rounded-2xl flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] shadow-xl text-white text-xl ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' : 'bg-primary hover:bg-[#08632e] shadow-primary/20'}`}
              >
                <Icon name="qr_code_2" className="text-[36px]" />
                <span className="text-xl">Pagar con QR</span>
              </button>
              <p className={`text-center text-xs px-4 leading-relaxed font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Serás redirigido al banco para completar el pago de forma segura
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center">
        <p className={`text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          Powered by <span className={`font-bold ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>CobraPy</span> <span className="mx-1">•</span> Sistema de Pagos Instantáneos
        </p>
        <button
          onClick={toggleDarkMode}
          className={`mt-8 w-10 h-10 flex items-center justify-center rounded-full transition-all border premium-shadow ${darkMode ? 'bg-zinc-800 text-zinc-500 border-zinc-800 hover:text-emerald-400' : 'bg-white text-slate-400 border-slate-100 hover:text-primary'}`}
        >
          <Icon name={darkMode ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
        </button>
      </footer>
    </div>
  );
}