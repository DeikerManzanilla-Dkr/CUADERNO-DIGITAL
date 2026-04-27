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
  Download
} from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';

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

  useEffect(() => {
    setMounted(true);
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
    }

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

  const handleInstallClick = async () => {
    if (!window.deferredPrompt) return;
    
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] Usuario instaló la app');
    } else {
      console.log('[PWA] Usuario rechazó la instalación');
    }
    
    window.deferredPrompt = undefined;
    setShowInstallButton(false);
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
            {/* Botón de Instalación PWA */}
            {showInstallButton && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                title="Instalar como app en tu dispositivo"
              >
                <Download className="w-4 h-4" />
                <span>Instalar App</span>
              </button>
            )}
            
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
          {/* Botón de Descarga: se muestra cuando Chrome detecta PWA instalable */}
          {showInstallButton && !isInstalled ? (
            <div className="flex justify-center mb-6 animate-fade-in">
              <button
                onClick={handleInstallClick}
                className="group flex items-center justify-center gap-3 w-full max-w-md py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]"
              >
                <MonitorSmartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Descargar Cuaderno Digital</span>
                <Zap className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Versión 2.0 "Rayo" - Ahora con PWA</span>
            </div>
          )}
          
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
          3. SECCIÓN DE SUSCRIPCIÓN (CTA)
          ============================================ */}
      <section className="border-t border-slate-800/50 bg-slate-900/20 py-16">
        <div className="max-w-md mx-auto px-4">
          <div className={`p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge de descuento */}
            <div className="absolute -top-1 right-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-b-lg shadow-lg">
                -20% Pronto Pago
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Suscripción Mensual</h2>
              <p className="text-slate-400 text-sm">Acceso completo a todos los módulos</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              {[
                'Punto de Venta Ilimitado',
                'Control de Inventario',
                'Sistema de Fiados',
                'Reportes de Ganancia Neta',
                'Soporte Técnico Prioritario',
                'Pago Móvil, USDT, Zelle'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Botón WhatsApp */}
            <a 
              href="https://wa.me/584247708542?text=Hola,%20quiero%20adquirir%20una%20licencia%20para%20Cuaderno%20Digital.%20Mi%20nombre%20es..."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              Adquirir Suscripción
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-center text-xs text-slate-500 mt-4">
              Te responderemos en minutos vía WhatsApp
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
