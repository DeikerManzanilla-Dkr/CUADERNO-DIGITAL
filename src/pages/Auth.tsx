import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, LogIn, Shield, Lock, Mail, MessageCircle, CheckCircle, ArrowRight, Zap } from "lucide-react";

// Planes de suscripción
const SUBSCRIPTION_PLANS = [
  {
    id: "monthly",
    name: "Plan Mensual",
    price: 15,
    period: "USD/mes",
    description: "Perfecto para comercios en crecimiento",
    features: [
      "Acceso total a todos los módulos",
      "Soporte prioritario 24/7",
      "Copias de seguridad diarias",
      "Reportes avanzados de ventas",
      "Escáner de códigos de barras",
      "Gestión de inventario completo",
      "Sistema de fiados/cobros"
    ],
    popular: true
  }
];

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Error al iniciar sesión: " + error.message);
    }
    setLoading(false);
  };

  const handleSubscribe = () => {
    window.open("https://wa.me/584247708542?text=Hola%2C%20quiero%20adquirir%20una%20licencia%20para%20Cuaderno%20Digital.%20Mi%20nombre%20es...", "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      {/* Panel Izquierdo - Branding y Planes */}
      <div className="lg:w-1/2 xl:w-3/5 bg-slate-950 border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">Cuaderno Digital</span>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 xl:p-16">
          {/* Hero Text */}
          <div className={`transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Gestión profesional{" "}
              <span className="text-cyan-400">para tu negocio</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-xl">
              Sistema POS completo con inventario, reportes y gestión de cobros. 
              Diseñado para comercios que buscan eficiencia.
            </p>
          </div>

          {/* Sección de Planes */}
          <div className={`transition-all duration-700 delay-200 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Planes de Suscripción
            </h2>

            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-cyan-400">${plan.price}</span>
                    <span className="text-sm text-slate-500 block">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-cyan-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleSubscribe}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4" />
                  Adquirir por WhatsApp
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                Activación inmediata
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                Datos seguros en la nube
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-600">
            © 2025 Cuaderno Digital. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Panel Derecho - Login */}
      <div className="lg:w-1/2 xl:w-2/5 bg-slate-900 flex items-center justify-center p-6 lg:p-8">
        <div className={`w-full max-w-md transition-all duration-700 delay-300 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Login Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
              <p className="text-sm text-slate-400">Accede a tu cuenta empresarial</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full h-12 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600
                    rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20
                    transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600
                    rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20
                    transition-all duration-200"
                />
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold
                  rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Cargando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Ingresar al Sistema
                  </span>
                )}
              </Button>
              {/* Separador */}
              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-800 px-4 text-xs text-slate-500 uppercase tracking-wider">¿No tienes cuenta?</span>
                </div>
              </div>

              {/* CTA Suscripción */}
              <div className="text-center">
                <button
                  onClick={handleSubscribe}
                  className="w-full py-3 border border-slate-600 hover:border-cyan-500/50 
                    text-slate-300 hover:text-cyan-400 rounded-xl transition-all
                    flex items-center justify-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Adquirir licencia por WhatsApp</span>
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Activación inmediata vía chat
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-3 pt-6 mt-4 border-t border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Conexión segura</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
