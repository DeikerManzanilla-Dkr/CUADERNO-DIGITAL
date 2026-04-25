import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, BarChart3, LogOut, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/pos", label: "Punto de Venta", icon: ShoppingCart },
  { to: "/inventario", label: "Inventario", icon: Package },
  { to: "/cobros", label: "Cobros", icon: DollarSign },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

interface UserProfile {
  business_name: string | null;
}

const AppLayout = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState<string>("Mi Negocio");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.business_name) {
          setBusinessName(profile.business_name);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight">
                {loading ? "Cargando..." : businessName}
              </span>
                          </div>
            <span className="sm:hidden font-bold text-sm tracking-tight">
              {businessName.slice(0, 15)}
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
