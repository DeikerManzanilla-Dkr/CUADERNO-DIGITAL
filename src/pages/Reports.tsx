import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Package, TrendingUp, CalendarDays, Lock } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
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
      supabase.from("sale_items").select("*").gte("created_at", dayStart).lte("created_at", dayEnd),
    ]);

    setDailySales((salesRes.data as Sale[]) || []);
    setDailyItems((itemsRes.data as SaleItem[]) || []);
    setLoadingDaily(false);
  };

  useEffect(() => {
    fetchDailyClose();
  }, [selectedDate]);

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const totalSales = sales.length;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  const dailyTotal = dailySales.reduce((s, sale) => s + Number(sale.total), 0);
  const dailySubtotal = dailySales.reduce((s, sale) => s + Number(sale.subtotal), 0);
  const dailyTax = dailySales.reduce((s, sale) => s + Number(sale.tax), 0);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingresos Totales</p>
              <p className="text-xl font-mono font-bold text-primary">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Ventas Realizadas</p>
              <p className="text-xl font-mono font-bold">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Stock Bajo</p>
              <p className="text-xl font-mono font-bold text-destructive">{lowStock} productos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="daily">
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Cierre Diario
          </TabsTrigger>
          <TabsTrigger value="sales">Historial de Ventas</TabsTrigger>
          <TabsTrigger value="stock">Stock Actual</TabsTrigger>
        </TabsList>

        {/* CIERRE DIARIO */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="close-date" className="text-xs text-muted-foreground uppercase tracking-wider">
                Fecha del cierre
              </Label>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="close-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 font-mono"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDailyClose} disabled={loadingDaily}>
              {loadingDaily ? "Cargando..." : "Actualizar"}
            </Button>
          </div>

          {/* Daily summary card */}
          <div className="rounded-lg border border-primary/30 bg-card p-5 pos-glow">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Resumen del {format(new Date(selectedDate + "T12:00:00"), "EEEE dd 'de' MMMM yyyy", { locale: es })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-mono font-bold">{dailySales.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-mono font-bold">${dailySubtotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IVA</p>
                <p className="text-2xl font-mono font-bold">${dailyTax.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total del Día</p>
                <p className="text-2xl font-mono font-bold text-primary">${dailyTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Daily items detail */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-secondary/30">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productos vendidos este día</h4>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant.</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">P. Unit.</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {loadingDaily ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                ) : dailyItems.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No hay ventas en esta fecha</td></tr>
                ) : (
                  dailyItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-sm font-medium">{item.product_name}</td>
                      <td className="p-3 text-right font-mono text-sm">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-sm">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold text-primary">${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Daily sales list */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-secondary/30">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transacciones del día</h4>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IVA</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingDaily ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                ) : dailySales.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No hay transacciones</td></tr>
                ) : (
                  dailySales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-sm">{format(new Date(sale.created_at), "HH:mm:ss")}</td>
                      <td className="p-3 text-right font-mono text-sm">${Number(sale.subtotal).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm text-muted-foreground">${Number(sale.tax).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold text-primary">${Number(sale.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IVA</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Cargando...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No hay ventas registradas</td></tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-sm">
                        {format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">${Number(sale.subtotal).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm text-muted-foreground">${Number(sale.tax).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold text-primary">${Number(sale.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="stock">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Cargando...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No hay productos registrados</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-mono text-sm text-primary">{p.sku}</td>
                      <td className="p-3 text-sm font-medium">{p.name}</td>
                      <td className="p-3 text-right font-mono text-sm">${Number(p.final_price).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            p.stock <= 5
                              ? "text-destructive"
                              : p.stock <= 20
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-sm text-muted-foreground">
                        ${(Number(p.final_price) * p.stock).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
