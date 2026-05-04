import { useState, useEffect } from "react";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AppLayout from "./components/AppLayout";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Cobros from "./pages/Cobros";
import Auth from "./pages/Auth";
import Home from "./pages/Home";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hook para detectar y forzar actualizaciones de la PWA
  usePWAUpdate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ZONA PÚBLICA (Sin AppLayout) */}
            <Route path="/" element={session ? <Navigate to="/pos" replace /> : <Home />} />
            <Route path="/login" element={session ? <Navigate to="/pos" replace /> : <Auth />} />

            {/* ZONA PRIVADA (Con AppLayout) - Requiere sesión */}
            <Route element={session ? <AppLayout /> : <Navigate to="/login" replace />}>
              <Route path="/pos" element={<POS />} />
              <Route path="/inventario" element={<Inventory />} />
              <Route path="/reportes" element={<Reports />} />
              <Route path="/cobros" element={<Cobros />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to={session ? "/pos" : "/"} replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
