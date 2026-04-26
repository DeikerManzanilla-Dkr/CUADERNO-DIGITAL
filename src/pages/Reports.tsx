import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  CalendarDays, 
  Lock,
  Sparkles,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Target,
  Zap,
  ChevronRight,
  BarChart4
} from "lucide-react";
import { format, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Sale {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
}

interface SaleItem {
  id: string;
  sale_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price_at_sale: number;
  subtotal: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  final_price: number;
  cost_price: number;
}

const Reports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [dailyItems, setDailyItems] = useState<SaleItem[]>([]);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [salesRes, productsRes] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("products").select("*").order("stock", { ascending: true }),
      ]);
      setSales((salesRes.data as Sale[]) || []);
      setProducts((productsRes.data as Product[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchDailyClose = async () => {
    setLoadingDaily(true);
    const dayStart = startOfDay(new Date(selectedDate + "T12:00:00")).toISOString();
    const dayEnd = endOfDay(new Date(selectedDate + "T12:00:00")).toISOString();

    const [salesRes, itemsRes] = await Promise.all([
      supabase.from("sales").select("*").gte("created_at", dayStart).lte("created_at", dayEnd).order("created_at", { ascending: false }),
      supabase.from("sale_items").select("*, cost_price_at_sale").gte("created_at", dayStart).lte("created_at", dayEnd),
    ]);

    setDailySales((salesRes.data as Sale[]) || []);
    setDailyItems((itemsRes.data as any[]) || []);
    const dailyNetProfit = (itemsRes.data as SaleItem[]).reduce((profit, item) => {
      const itemProfit = (item.unit_price - item.cost_price_at_sale) * item.quantity;
      return profit + itemProfit;
    }, 0);
    setNetProfit(dailyNetProfit);
    setLoadingDaily(false);
  };

  useEffect(() => {
    fetchDailyClose();
  }, [selectedDate]);

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const totalSales = sales.length;
  const lowStock = products.filter((p) => p.stock <= 5).length;
  
  // Calcular margen de ganancia promedio
  const avgMargin = products.length > 0 
    ? products.reduce((acc, p) => acc + ((p.final_price - p.cost_price) / p.cost_price) * 100, 0) / products.length 
    : 0;
  
  // Productos más vendidos (simulado basado en stock bajo = alta rotación)
  const topProducts = [...products]
    .sort((a, b) => (a.stock - b.stock))
    .slice(0, 5);
  
  // Calcular ganancias netas totales de todos los tiempos
  const totalNetProfitAll = sales.reduce((totalProfit, sale) => {
    const saleItems = dailyItems.filter(item => item.sale_id === sale.id);
    const saleProfit = saleItems.reduce((profit, item) => {
      const itemProfit = (item.unit_price - item.cost_price_at_sale) * item.quantity;
      return profit + itemProfit;
    }, 0);
    return totalProfit + saleProfit;
  }, 0);

  const dailyTotal = dailySales.reduce((s, sale) => s + Number(sale.total), 0);
  const dailySubtotal = dailySales.reduce((s, sale) => s + Number(sale.subtotal), 0);
  const dailyTax = dailySales.reduce((s, sale) => s + Number(sale.tax), 0);
  const dailyNetProfit = dailyItems.reduce((profit, item) => {
    const itemProfit = (item.unit_price - item.cost_price_at_sale) * item.quantity;
    return profit + itemProfit;
  }, 0);
  
  // Calcular métricas adicionales
  const avgTicket = dailySales.length > 0 ? dailyTotal / dailySales.length : 0;
  const profitMargin = dailyTotal > 0 ? (dailyNetProfit / dailyTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-6">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Reportes
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Métricas y análisis de ventas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm font-mono">
              {format(new Date(), "dd MMM yyyy", { locale: es })}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ganancias Netas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-emerald-400 font-medium">+{profitMargin.toFixed(1)}% margen</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ganancias Netas Hoy</p>
            <p className="text-3xl font-mono font-bold text-emerald-400">
              ${dailyNetProfit.toFixed(2)}
            </p>
          </div>

          {/* Ventas del Día */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ventas Hoy</p>
            <p className="text-2xl font-mono font-bold text-slate-200">{dailySales.length}</p>
            <p className="text-xs text-slate-500 mt-1">transacciones</p>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ticket Promedio</p>
            <p className="text-2xl font-mono font-bold text-slate-200">${avgTicket.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">por venta</p>
          </div>

          {/* Stock Crítico */}
          <div className={`rounded-xl p-5 shadow-lg border ${lowStock > 0 ? 'bg-amber-950/30 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${lowStock > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800 border-slate-700'}`}>
                {lowStock > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            <p className={`text-xs uppercase tracking-wider mb-1 ${lowStock > 0 ? 'text-amber-400' : 'text-slate-500'}`}>Stock Crítico</p>
            <p className={`text-2xl font-mono font-bold ${lowStock > 0 ? 'text-amber-400' : 'text-slate-200'}`}>{lowStock}</p>
            <p className={`text-xs mt-1 ${lowStock > 0 ? 'text-amber-500/70' : 'text-slate-500'}`}>productos</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <TabsTrigger 
              value="daily" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 rounded-md px-5 py-2 text-slate-400 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cierre
            </TabsTrigger>
            <TabsTrigger 
              value="sales"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 rounded-md px-5 py-2 text-slate-400 transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger 
              value="stock"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 rounded-md px-5 py-2 text-slate-400 transition-all"
            >
              <Package className="w-4 h-4 mr-2" />
              Inventario
            </TabsTrigger>
          </TabsList>

          {/* CIERRE DIARIO */}
          <TabsContent value="daily" className="space-y-4">
            {/* Selector de Fecha */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha del cierre</p>
                  <p className="text-slate-200 font-medium">
                    {format(new Date(selectedDate + "T12:00:00"), "EEEE dd 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 bg-slate-950 border-slate-700 text-slate-200 rounded-lg font-mono focus:border-slate-500"
                />
                <Button 
                  onClick={fetchDailyClose} 
                  disabled={loadingDaily}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingDaily ? "animate-spin" : ""}`} />
                  {loadingDaily ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
            </div>

            {/* Grid de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Transacciones", value: dailySales.length },
                { label: "Subtotal", value: `$${dailySubtotal.toFixed(2)}` },
                { label: "IVA", value: `$${dailyTax.toFixed(2)}` },
                { label: "Total", value: `$${dailyTotal.toFixed(2)}`, highlight: true },
              ].map((metric) => (
                <div key={metric.label} className={`p-4 rounded-xl border ${metric.highlight ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800'}`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{metric.label}</p>
                  <p className={`text-xl font-mono font-semibold ${metric.highlight ? 'text-slate-100' : 'text-slate-400'}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabla de Productos Vendidos */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                  Productos vendidos
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Cant.</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">P. Unit.</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDaily ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">Cargando...</td></tr>
                    ) : dailyItems.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">No hay ventas en esta fecha</td></tr>
                    ) : (
                      dailyItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-3 text-sm text-slate-300">{item.product_name}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-400">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-500">${Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm text-emerald-400">${Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lista de Transacciones */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Transacciones
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Hora</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">IVA</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDaily ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">Cargando...</td></tr>
                    ) : dailySales.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">No hay transacciones</td></tr>
                    ) : (
                      dailySales.map((sale) => (
                        <tr key={sale.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-3 text-sm text-slate-400 font-mono">{format(new Date(sale.created_at), "HH:mm:ss")}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-400">${Number(sale.subtotal).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-500">${Number(sale.tax).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-200">${Number(sale.total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* HISTORIAL DE VENTAS */}
          <TabsContent value="sales">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  Historial de Ventas
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">IVA</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">Cargando...</td></tr>
                    ) : sales.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">No hay ventas registradas</td></tr>
                    ) : (
                      sales.map((sale) => (
                        <tr key={sale.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-3 text-sm text-slate-300">
                            {format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                          </td>
                          <td className="p-3 text-right font-mono text-sm text-slate-400">${Number(sale.subtotal).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-500">${Number(sale.tax).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-200">${Number(sale.total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* STOCK ACTUAL */}
          <TabsContent value="stock">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    Stock Actual
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> OK
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Bajo
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Precio</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500">Cargando...</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500">No hay productos registrados</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-3 font-mono text-sm text-slate-400">{p.sku}</td>
                          <td className="p-3 text-sm text-slate-300 font-medium">{p.name}</td>
                          <td className="p-3 text-right font-mono text-sm text-slate-400">${Number(p.final_price).toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-medium ${
                              p.stock <= 5
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {p.stock <= 5 && <AlertTriangle className="w-3 h-3" />}
                              {p.stock}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-sm text-slate-500">
                            ${(Number(p.final_price) * p.stock).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
