import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, LogIn, Shield, Lock, Mail } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Efecto de entrada suave del logo
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error al iniciar sesión", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo con efecto de partículas/grid tech */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Efectos de luz ambiental - Color turquesa distintivo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Contenedor Principal */}
      <div 
        className={`relative w-full max-w-md transition-all duration-700 ease-out transform ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Card Principal con efecto 3D */}
        <div className="relative group">
          {/* Sombra profunda para efecto 3D - Gradiente turquesa */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
          
          {/* Contenedor principal */}
          <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            {/* Header con gradiente turquesa */}
            <div className="relative h-32 bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-cyan-600/20 flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
              
              {/* Logo - Entrada suave y profesional */}
              <div className={`relative transition-all duration-1000 ease-out transform ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <ShoppingCart className="w-10 h-10 text-white drop-shadow-md" />
                </div>
                {/* Glow sutil */}
                <div className="absolute -inset-2 bg-cyan-400/30 rounded-2xl blur-xl opacity-60" />
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6">
              {/* Título - Entrada suave */}
              <div className={`text-center space-y-2 transition-all duration-700 delay-200 ease-out transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-100 to-teal-200 bg-clip-text text-transparent tracking-tight">
                  CUADERNO DIGITAL
                </h1>
                <p className="text-sm text-cyan-200/80 font-medium">
                  Sistema POS Profesional
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Input Email con autoComplete */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-100 text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    className="w-full h-12 bg-slate-800/50 border-cyan-700/50 text-white placeholder:text-cyan-600/70 
                      rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] 
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30
                      transition-all duration-200"
                  />
                </div>

                {/* Input Password con autoComplete */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-cyan-100 text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-12 bg-slate-800/50 border-cyan-700/50 text-white placeholder:text-cyan-600/70 
                      rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] 
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30
                      transition-all duration-200"
                  />
                </div>

                {/* Botón de login profesional */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-400 hover:via-teal-400 hover:to-cyan-500
                      text-white font-semibold text-lg rounded-xl
                      shadow-[0_4px_14px_rgba(34,211,238,0.4)]
                      hover:shadow-[0_6px_20px_rgba(34,211,238,0.5)]
                      active:scale-[0.98]
                      transition-all duration-200
                      border-0"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cargando...
                      </span>
                    ) : (
                      "Ingresar al Sistema"
                    )}
                  </Button>
                </div>

                {/* Footer con indicadores de seguridad */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                    <span>Conexión segura</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <p className="text-center text-xs text-slate-500">
                    Acceso restringido
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
