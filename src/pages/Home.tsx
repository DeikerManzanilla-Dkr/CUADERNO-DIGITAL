import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  Cloud, 
  BarChart3, 
  MonitorSmartphone, 
  CheckCircle2,
  ShoppingCart,
  Users,
  X,
  Zap,
  Download,
  ExternalLink,
  Info,
  Wallet,
  Smartphone,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { toast } from 'sonner';

// Extend Window interface for PWA install prompt
declare global {
  interface Window {
    deferredPrompt?: Event & {
      prompt(): Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
  }
}

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Estados para selector de pagos
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('15');

  useEffect(() => {
    setMounted(true);
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
    }

    // Detectar iOS para instrucciones específicas
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event - SIEMPRE se ejecuta, fuera de condicionales
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Evento beforeinstallprompt detectado');
      e.preventDefault();
      window.deferredPrompt = e as Window['deferredPrompt'];
      setShowInstallButton(true);
      console.log('[PWA] deferredPrompt guardado en window');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      window.deferredPrompt = undefined;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallAction = async () => {
    // Estado A: Instalador disponible (Chrome/Android)
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('¡Cuaderno Digital instalado correctamente!');
        window.deferredPrompt = undefined;
        setShowInstallButton(false);
      } else {
        toast.info('Instalación cancelada. Puedes intentarlo de nuevo cuando quieras.');
      }
      return;
    }

    // Estado B: Ya está instalada
    if (isInstalled) {
      toast.success('¡Cuaderno Digital ya está instalado en tu dispositivo!', {
        description: 'Busca el icono en tu pantalla de inicio para abrirlo.',
        duration: 5000
      });
      return;
    }

    // Estado C: No compatible o iOS (instrucciones manuales)
    if (isIOS) {
      toast.info('Para instalar en iPhone/iPad:', {
        description: 'Toca el botón Compartir (↗️) y selecciona "Agregar a pantalla de inicio"',
        duration: 8000
      });
    } else {
      toast.info('Usa Chrome en Android o Safari en iOS para instalar la app', {
        description: 'Tu navegador actual no soporta instalación directa.',
        duration: 6000
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      
      {/* ============================================
          1. NAV BAR MINIMALISTA
          ============================================ */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/50 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-500 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span>TCD</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de Instalación PWA - Siempre visible con estado adaptativo */}
            <button
              onClick={handleInstallAction}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
              title={isInstalled ? "App ya instalada" : showInstallButton ? "Instalar como app" : "Ver opciones de instalación"}
            >
              {showInstallButton && !isInstalled ? (
                <><Download className="w-4 h-4" /><span>Instalar App</span></>
              ) : isInstalled ? (
                <><ExternalLink className="w-4 h-4" /><span>App Instalada</span></>
              ) : (
                <><Info className="w-4 h-4" /><span>Instalar</span></>
              )}
            </button>
            
            {/* Botón Ingresar: SIEMPRE visible si estamos en navegador (no standalone) */}
            {!isInstalled && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================
          2. HERO & CARACTERÍSTICAS (El "Wow" Visual)
          ============================================ */}
      <main className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        {/* Hero Text */}
        <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Botón de Instalación con 3 Estados y Badge de Versión */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={handleInstallAction}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MonitorSmartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>
                {showInstallButton && !isInstalled 
                  ? 'Descargar Cuaderno Digital'
                  : isInstalled 
                    ? 'Abrir App Instalada'
                    : 'Instalar App'}
              </span>
              {showInstallButton && !isInstalled ? (
                <Zap className="w-4 h-4 animate-pulse" />
              ) : isInstalled ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
            </button>

            {/* Badge de Versión siempre visible debajo */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/50 border border-cyan-500/30 rounded-full">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                Actualización v2.0 "Rayo"
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Tu Negocio, en un <span className="text-cyan-500">Cuaderno Inteligente</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Sistema POS ultrarrápido y gestión financiera diseñada para negocios que no tienen tiempo que perder. Optimizado para tablets y móviles.
          </p>
        </div>

        {/* Grid 2x2 Business Pro */}
        <div className={`grid md:grid-cols-2 gap-6 max-w-4xl mx-auto transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Card 1: Búsqueda Ultra-Rápida */}
          <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:bg-slate-900/70">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Búsqueda Ultra-Rápida</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Encuentra productos por nombre o código en segundos. Experiencia tipo "Pokedex" con navegación por teclado.
            </p>
          </div>

          {/* Card 2: Sincronización Total */}
          <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:bg-slate-900/70">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cloud className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Sincronización Total</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Toda tu información segura en la nube. Úsalo como App nativa en tu teléfono (PWA) sin instalar nada.
            </p>
          </div>

          {/* Card 3: Reportes Inteligentes */}
          <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:bg-slate-900/70">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Reportes Inteligentes</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Métricas claras: ticket promedio, ganancia neta, cierres diarios. Toma decisiones con datos reales.
            </p>
          </div>

          {/* Card 4: Sistema de Fiados */}
          <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:bg-slate-900/70">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Sistema de Fiados</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gestiona deudas y pagos parciales. Nunca pierdas el control de lo que te deben tus clientes.
            </p>
          </div>
        </div>
      </main>

      {/* ============================================
          3. SECCIÓN DE SUSCRIPCIÓN (CTA) - PORTAL DE PAGOS INTERACTIVO
          ============================================ */}
      <section className="border-t border-slate-800/50 bg-slate-900/20 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className={`p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge de descuento */}
            <div className="absolute -top-1 right-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-b-lg shadow-lg">
                -20% Pronto Pago
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Adquirir Suscripción</h2>
              <p className="text-slate-400 text-sm">Selecciona tu método de pago preferido</p>
            </div>

            {/* Grid de Métodos de Pago */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Binance Pay */}
              <button
                onClick={() => setSelectedMethod('binance')}
                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                  selectedMethod === 'binance'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800 border-slate-700 hover:border-amber-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'binance' ? 'bg-amber-500/20' : 'bg-slate-700'
                }`}>
                  <Wallet className={`w-5 h-5 ${selectedMethod === 'binance' ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>
                <span className={`text-xs font-medium ${selectedMethod === 'binance' ? 'text-amber-400' : 'text-slate-400'}`}>
                  Binance
                </span>
              </button>

              {/* Pago Móvil */}
              <button
                onClick={() => setSelectedMethod('pagomovil')}
                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                  selectedMethod === 'pagomovil'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800 border-slate-700 hover:border-blue-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'pagomovil' ? 'bg-blue-500/20' : 'bg-slate-700'
                }`}>
                  <Smartphone className={`w-5 h-5 ${selectedMethod === 'pagomovil' ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <span className={`text-xs font-medium ${selectedMethod === 'pagomovil' ? 'text-blue-400' : 'text-slate-400'}`}>
                  Pago Móvil
                </span>
              </button>

              {/* Stripe / Tarjeta */}
              <button
                onClick={() => setSelectedMethod('stripe')}
                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                  selectedMethod === 'stripe'
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800 border-slate-700 hover:border-indigo-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'bg-indigo-500/20' : 'bg-slate-700'
                }`}>
                  <CreditCard className={`w-5 h-5 ${selectedMethod === 'stripe' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <span className={`text-xs font-medium ${selectedMethod === 'stripe' ? 'text-indigo-400' : 'text-slate-400'}`}>
                  Tarjeta
                </span>
              </button>
            </div>

            {/* Panel de Datos según método seleccionado */}
            {selectedMethod === 'binance' && (
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5 mb-6">
                <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Datos para Binance Pay
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                    <span className="text-slate-400">ID de Pay:</span>
                    <span className="text-slate-200 font-mono">495 123 655</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Monto:</span>
                    <span className="text-white font-semibold">10.00 USDT</span>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'pagomovil' && (
              <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-5 mb-6">
                <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Datos para Pago Móvil
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-blue-500/10">
                    <span className="text-slate-400">Banco:</span>
                    <span className="text-slate-200">Banco de Venezuela</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-500/10">
                    <span className="text-slate-400">Teléfono:</span>
                    <span className="text-slate-200 font-mono">0424-7708542</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-500/10">
                    <span className="text-slate-400">ID:</span>
                    <span className="text-slate-200 font-mono">V-31239605</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Monto:</span>
                    <span className="text-white font-semibold">Equiv.  USD</span>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'stripe' && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-5 mb-6">
                <h3 className="text-indigo-400 font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pago con Tarjeta
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Serás redirigido a nuestra pasarela de pagos segura para completar la transacción.
                </p>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-400">Monto a pagar:</span>
                  <span className="text-white font-semibold">$10.00 USD</span>
                </div>
              </div>
            )}

            {/* Input de Referencia (solo para Binance y Pago Móvil) */}
            {selectedMethod && selectedMethod !== 'stripe' && (
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">
                  Número de Referencia / Hash de transacción
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={selectedMethod === 'binance' ? '0x... o número de referencia' : 'Últimos 4 dígitos o ref.'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
                />
              </div>
            )}

            {/* Botón WhatsApp Dinámico */}
            {selectedMethod && (
              <a
                href={(() => {
                  const phone = '584247708542';
                  let message = '';
                  if (selectedMethod === 'binance') {
                    message = `Hola, elegí pagar por Binance Pay. Mi referencia es: ${reference || '[pendiente]'} ¿Me confirmas la recepción de los 15 USDT?`;
                  } else if (selectedMethod === 'pagomovil') {
                    message = `Hola, ya hice el Pago Móvil. Mi referencia es: ${reference || '[pendiente]'} ¿Me confirmas la recepción?`;
                  } else if (selectedMethod === 'stripe') {
                    message = 'Hola, quiero pagar mi suscripción con tarjeta de crédito/débito. ¿Me envías el link de pago?';
                  }
                  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                })()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                {selectedMethod === 'stripe' ? 'Solicitar Link de Pago' : 'Notificar Pago por WhatsApp'}
                <ArrowRight className="w-5 h-5" />
              </a>
            )}

            {!selectedMethod && (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">Selecciona un método de pago arriba para continuar</p>
              </div>
            )}

            <p className="text-center text-xs text-slate-500 mt-4">
              Activación inmediata tras confirmar el pago
            </p>
          </div>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-slate-800/50 py-8 text-center">
        <p className="text-slate-500 text-sm">
          © 2026 Cuaderno Digital. Todos los derechos reservados.
        </p>
      </footer>

      {/* ============================================
          4. MODAL DE LOGIN
          ============================================ */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginModal(false);
          }}
        >
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Botón cerrar */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Componente AuthForm */}
            <AuthForm 
              onSuccess={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
