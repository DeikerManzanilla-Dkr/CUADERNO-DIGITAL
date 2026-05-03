import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { Package, ShoppingCart, BarChart3, LogOut, DollarSign, Clock, AlertCircle, Store, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { differenceInDays, parseISO, isAfter } from "date-fns";
import BarcodeScanner from "@/components/BarcodeScanner";
import { ScannerProvider, useScanner } from "@/contexts/ScannerContext";

const navItems = [
  { to: "/inventario", label: "Inventario", icon: Package },
  { to: "/cobros", label: "Cobros", icon: DollarSign },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

interface UserProfile {
  business_name: string | null;
  subscription_status: boolean | null;
  expires_at: string | null;
  paid_early: boolean | null;
}

const AppLayoutContent = () => {
  const navigate = useNavigate();
  const { isScannerOpen, openScanner, closeScanner, onCodeDetected } = useScanner();
  const [businessName, setBusinessName] = useState<string>("Mi Negocio");
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name, subscription_status, expires_at, paid_early")
          .eq("id", user.id)
          .maybeSingle();

        // Type assertion temporal hasta que se ejecute la migración SQL
        const profileData = profile as any;

        if (profileData?.business_name) {
          setBusinessName(profileData.business_name);
        }

        // Calcular días restantes de licencia
        if (profileData?.expires_at) {
          const expiryDate = parseISO(profileData.expires_at);
          const today = new Date();
          const days = differenceInDays(expiryDate, today);
          
          // Si pagó antes del día 5, extender 5 días extra
          const finalDays = profileData.paid_early && days > 0 ? days + 5 : days;
          
          setDaysRemaining(finalDays);
          setSubscriptionActive(profileData.subscription_status ?? true);
        }
      } catch (error) {
        // Silencioso para producción
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/pos" className="flex items-center gap-3 group hover:opacity-80 transition-opacity cursor-pointer">
            <div className="bg-cyan-500 p-2 rounded-xl shadow-lg shadow-cyan-500/20 group-hover:rotate-12 transition-transform">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xl font-black text-slate-100 tracking-tighter">
                MI <span className="text-cyan-400">NEGOCIO</span>
              </span>
            </div>
            <span className="sm:hidden text-lg font-black text-slate-100 tracking-tighter">
              MI <span className="text-cyan-400">NEGOCIO</span>
            </span>
          </Link>
          {/* Indicador de días de licencia - Desktop */}
          {daysRemaining !== null && (
            <div className="hidden md:flex items-center">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                daysRemaining <= 3 
                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                  : daysRemaining <= 7 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}>
                {daysRemaining <= 3 ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>
                  {daysRemaining > 0 
                    ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                    : "Licencia vencida"
                  }
                </span>
              </div>
            </div>
          )}

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <item.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
            
            {/* Indicador de días - Mobile (solo icono) */}
            {daysRemaining !== null && daysRemaining <= 7 && (
              <div className="md:hidden flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  daysRemaining <= 3 ? "bg-red-500 animate-pulse" : "bg-amber-500"
                }`} title={`${daysRemaining} días restantes`} />
              </div>
            )}
            
            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6">
        <Outlet />
      </main>
      
      {/* Modal de Escáner */}
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={closeScanner} 
        onCodeDetected={onCodeDetected} 
      />
    </div>
  );
};

const AppLayout = () => {
  return (
    <ScannerProvider>
      <AppLayoutContent />
    </ScannerProvider>
  );
};

export default AppLayout;
