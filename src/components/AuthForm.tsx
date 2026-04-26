import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Lock, Mail } from "lucide-react";

interface AuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const AuthForm = ({ onSuccess, className = "" }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ 
        title: "Error al iniciar sesión", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "¡Bienvenido!", 
        description: "Inicio de sesión exitoso" 
      });
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className={`relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden ${className}`}>
      {/* Header con gradiente */}
      <div className="relative h-24 bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-cyan-600/20 flex items-center justify-center">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <LogIn className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
          <p className="text-sm text-slate-400">Accede a tu Cuaderno Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-sm font-medium flex items-center gap-2">
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
              className="w-full h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 
                rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30
                transition-all duration-200"
            />
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-sm font-medium flex items-center gap-2">
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
              className="w-full h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 
                rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30
                transition-all duration-200"
            />
          </div>

          {/* Botón */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400
              text-white font-semibold rounded-lg
              shadow-lg shadow-cyan-500/20
              active:scale-[0.98]
              transition-all duration-200
              border-0 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cargando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Ingresar
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
