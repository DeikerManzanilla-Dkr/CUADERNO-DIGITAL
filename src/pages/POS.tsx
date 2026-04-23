import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Trash2, Plus, Minus, ShoppingCart, RefreshCw, CreditCard, Banknote } from "lucide-react";
import { useExchangeRate, formatBs } from "@/services/bcvService";

interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  unit_price: number; // final_price con IVA incluido
  base_price: number; // precio sin IVA
  iva_amount: number; // monto de IVA del producto
  cost_price: number;
  quantity: number;
  stock: number;
}

type PaymentMethod = "cash" | "credit";

const POS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);

  const { rate, loading: loadingRate, fetchRate, setManualRate } = useExchangeRate();

  // El total es la suma de los precios finales (IVA ya incluido)
  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  // Desglose para reportes (opcional)
  const baseTotal = cart.reduce((s, i) => s + i.base_price * i.quantity, 0);
  const ivaTotal = cart.reduce((s, i) => s + i.iva_amount * i.quantity, 0);
  const totalBs = rate ? total * rate.usdToBs : 0;

  // Focus rate input when editing starts
  useEffect(() => {
    if (editingRate && rateInputRef.current) {
      rateInputRef.current.focus();
      rateInputRef.current.select();
    }
  }, [editingRate]);

  // Handle rate edit
  const handleRateClick = () => {
    if (rate) {
      setRateInput(rate.usdToBs.toFixed(2));
      setEditingRate(true);
    }
  };

  const saveRate = () => {
    const newRate = parseFloat(rateInput);
    if (!isNaN(newRate) && newRate > 0) {
      setManualRate(newRate);
    }
    setEditingRate(false);
  };

  const handleRateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveRate();
    } else if (e.key === "Escape") {
      setEditingRate(false);
    }
  };

  const addToCart = useCallback(async () => {
    const sku = skuInput.trim().toUpperCase();
    if (!sku) return;

    const existing = cart.find((i) => i.sku === sku);
    if (existing) {
      if (existing.quantity >= existing.stock) {
        toast.error("Stock insuficiente");
        setSkuInput("");
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.sku === sku ? { ...i, quantity: i.quantity + 1 } : i))
      );
      setSkuInput("");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("sku", sku)
      .maybeSingle();

    if (error || !data) {
      toast.error("Producto no encontrado");
      setLoading(false);
      setSkuInput("");
      return;
    }

    if (data.stock <= 0) {
      toast.error("Sin stock disponible");
      setLoading(false);
      setSkuInput("");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        product_id: data.id,
        sku: data.sku,
        name: data.name,
        unit_price: Number(data.final_price || data.sale_price),
        base_price: Number(data.base_price || 0),
        iva_amount: Number(data.iva_amount || 0),
        cost_price: Number(data.cost_price),
        quantity: 1,
        stock: data.stock,
      },
    ]);
    setSkuInput("");
    setLoading(false);
  }, [skuInput, cart]);

  const updateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.sku !== sku) return i;
          const newQty = i.quantity + delta;
          if (newQty > i.stock) {
            toast.error("Stock insuficiente");
            return i;
          }
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (sku: string) => {
    setCart((prev) => prev.filter((i) => i.sku !== sku));
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    
    // Validar campos de cliente si es venta a crédito
    if (paymentMethod === "credit") {
      if (!customerName.trim() || !customerPhone.trim()) {
        toast.error("Nombre y teléfono del cliente son obligatorios para venta a crédito");
        return;
      }
    }
    
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Crear la venta con método de pago y datos del cliente
      const saleData: any = { 
        subtotal: baseTotal, 
        tax: ivaTotal, 
        total, 
        payment_method: paymentMethod,
        user_id: user.id 
      };
      
      // Agregar datos del cliente si es crédito
      if (paymentMethod === "credit") {
        saleData.customer_name = customerName.trim();
        saleData.customer_phone = customerPhone.trim();
        saleData.status = "pending"; // La venta queda pendiente hasta que se pague
      }
      
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert(saleData)
        .select()
        .single();

      if (saleError || !sale) throw saleError;

      const items = cart.map((i) => ({
        sale_id: sale.id,
        product_id: i.product_id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.unit_price * i.quantity,
        user_id: user.id,
      }));

      const { error: itemsError } = await supabase.from("sale_items").insert(items);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        const { error } = await supabase
          .from("products")
          .update({ stock: item.stock - item.quantity })
          .eq("id", item.product_id);
        if (error) throw error;
      }

      // Si es crédito, crear el registro de deuda
      if (paymentMethod === "credit") {
        const { error: debtError } = await supabase.from("debts").insert({
          sale_id: sale.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          total_amount: total,
          remaining_amount: total,
          status: "pending",
          user_id: user.id,
        });
        
        if (debtError) throw debtError;
        toast.success(`Fiado registrado: $${total.toFixed(2)} - ${customerName.trim()}`);
      } else {
        toast.success(`Venta procesada: $${total.toFixed(2)}`);
      }
      
      // Limpiar formulario
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("cash");
    } catch (err) {
      toast.error("Error al procesar la venta");
      console.error(err);
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      {/* Scanner / Input */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addToCart()}
              placeholder="Escanear o escribir código SKU..."
              className="pl-10 font-mono text-lg h-12 bg-card border-border"
              autoFocus
              disabled={loading}
            />
          </div>
          <Button onClick={addToCart} disabled={loading} size="lg" className="h-12">
            Agregar
          </Button>
        </div>

        {/* Cart Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
                <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant.</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Escanea un producto para comenzar</p>
                  </td>
                </tr>
              ) : (
                cart.map((item) => (
                  <tr key={item.sku} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-sm text-primary">{item.sku}</td>
                    <td className="p-3 text-sm font-medium">{item.name}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.sku, -1)}
                          className="w-7 h-7 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-mono font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.sku, 1)}
                          className="w-7 h-7 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">${item.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-sm font-semibold">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => removeItem(item.sku)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Panel */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 pos-glow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Resumen</h2>
            <button
              onClick={fetchRate}
              disabled={loadingRate}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              title="Actualizar tasa BCV"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRate ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Total Principal USD */}
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Total a Pagar</p>
            <p className="text-3xl font-mono font-bold text-primary">
              ${total.toFixed(2)}
            </p>
            {rate && totalBs > 0 && (
              <p className="text-lg font-mono text-muted-foreground mt-1">
                {formatBs(totalBs)}
              </p>
            )}
            {/* Tasa BCV - Click to Edit */}
            <div className="mt-2 flex items-center justify-center gap-1 text-xs">
              <span className="text-muted-foreground">Tasa BCV:</span>
              {editingRate ? (
                <input
                  ref={rateInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  onBlur={saveRate}
                  onKeyDown={handleRateKeyDown}
                  className="w-20 px-1 py-0.5 text-center font-mono bg-background border border-primary rounded text-primary"
                />
              ) : (
                <button
                  onClick={handleRateClick}
                  className="font-mono text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 decoration-dotted"
                  title="Clic para editar"
                >
                  {rate ? rate.usdToBs.toFixed(2) : "--"} BS/USD
                </button>
              )}
              {rate?.source === "api" && (
                <span className="text-[10px] text-green-600">●</span>
              )}
              {rate?.source === "manual" && (
                <span className="text-[10px] text-orange-500">●</span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (sin IVA)</span>
              <span className="font-mono">${baseTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA incluido</span>
              <span className="font-mono">${ivaTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Selector de método de pago */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center justify-center gap-2 p-2 rounded-md border transition-colors ${
                  paymentMethod === "cash"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-sm font-medium">Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod("credit")}
                className={`flex items-center justify-center gap-2 p-2 rounded-md border transition-colors ${
                  paymentMethod === "credit"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Crédito / Fiado</span>
              </button>
            </div>
          </div>

          {/* Campos de cliente para venta a crédito */}
          {paymentMethod === "credit" && (
            <div className="space-y-3 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Nombre del Cliente *
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre completo"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Teléfono del Cliente *
                </Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0412-1234567"
                  className="bg-background font-mono"
                />
              </div>
            </div>
          )}

          <Button
            onClick={processSale}
            disabled={cart.length === 0 || processing || (paymentMethod === "credit" && (!customerName.trim() || !customerPhone.trim()))}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {processing ? "Procesando..." : paymentMethod === "credit" ? "Registrar Fiado" : "Procesar Venta"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {cart.length} artículo{cart.length !== 1 ? "s" : ""} en el carrito
          </p>
        </div>
      </div>
    </div>
  );
};

export default POS;
