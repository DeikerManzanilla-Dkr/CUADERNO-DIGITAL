import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Trash2, Plus, Minus, ShoppingCart, RefreshCw, CreditCard, Banknote, Sparkles, Package, ArrowRight, X, ScanLine } from "lucide-react";
import { useExchangeRate, formatBs } from "@/services/bcvService";
import SaleSuccessOverlay from "@/components/SaleSuccessOverlay";
import { useScanner } from "@/contexts/ScannerContext";
import BarcodeScanner from "@/components/BarcodeScanner";
import { playBeep, playErrorBeep } from "@/utils/audio";

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

interface Product {
  id: string;
  sku: string;
  name: string;
  final_price: number;
  base_price: number;
  iva_amount: number;
  cost_price: number;
  stock: number;
}

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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState("Venta Aprobada");
  
  // Estados para búsqueda híbrida tipo Pokedex
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { rate, loading: loadingRate, fetchRate, setManualRate } = useExchangeRate();
  const { setCodeHandler } = useScanner();
  const [isScanning, setIsScanning] = useState(false); // Escáner local en POS

  // Efecto para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda híbrida en tiempo real
  useEffect(() => {
    const searchProducts = async () => {
      const query = skuInput.trim();
      if (query.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`sku.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(8);

      if (!error && data) {
        setSearchResults(data as Product[]);
        setShowDropdown(data.length > 0);
        setSelectedIndex(0);
      }
      setIsSearching(false);
    };

    const timeout = setTimeout(searchProducts, 150);
    return () => clearTimeout(timeout);
  }, [skuInput]);

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

  const addProductToCart = useCallback((product: Product) => {
    const existing = cart.find((i) => i.sku === product.sku);
    if (existing) {
      if (existing.quantity >= existing.stock) {
        toast.error("Stock insuficiente");
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      if (product.stock <= 0) {
        toast.error("Sin stock disponible");
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          unit_price: Number(product.final_price),
          base_price: Number(product.base_price || 0),
          iva_amount: Number(product.iva_amount || 0),
          cost_price: Number(product.cost_price),
          quantity: 1,
          stock: product.stock,
        },
      ]);
    }
    setSkuInput("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [cart]);

  // Handler para códigos detectados (definido fuera del useEffect para estabilidad)
  const handleCodeDetected = async (code: string | null | undefined) => {
    if (!code) return;
    const trimmedCode = code.trim();

    // 1. Feedback INMEDIATO (Beep) - ocurre al instante, sin esperar BD
    playBeep();

    console.log("🔍 Buscando en BD el SKU:", trimmedCode);
    console.log("   Longitud:", trimmedCode.length, "caracteres");
    console.log("   Char codes:", [...trimmedCode].map(c => c.charCodeAt(0)));

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("sku", trimmedCode)
      .maybeSingle();

    if (error) {
      console.error("❌ Error Supabase:", error);
      playErrorBeep();
      toast.error(`Error de base de datos: ${error.message}`);
      return;
    }

    if (data) {
      console.log("✅ Producto hallado:", data);
      addProductToCart(data as Product);
      toast.success(`¡Agregado! ${data.name}`);
    } else {
      console.warn("⚠️ Código escaneado pero NO EXISTE en tabla products:", trimmedCode);
      console.warn("   Revisa: ¿El SKU en la BD es exactamente '" + trimmedCode + "'?");
      playErrorBeep();
      toast.error(`Producto no encontrado: ${trimmedCode}`);
      
      const { data: similar } = await supabase
        .from("products")
        .select("sku, name")
        .ilike("sku", `%${trimmedCode}%`)
        .limit(3);
      
      if (similar && similar.length > 0) {
        console.log("💡 Productos similares encontrados:", similar);
        toast.info(`¿Quizás quisiste: ${similar.map(p => p.sku).join(", ")}?`);
      }
    }
  };

  // Configurar handler: Registro AGRESIVO al montar, limpiar al desmontar
  useEffect(() => {
    console.log("📡 POS.tsx montado - Registrando handler de escáner");
    setCodeHandler(handleCodeDetected);

    return () => {
      console.log("📡 POS.tsx desmontado - Limpiando handler");
      setCodeHandler(null);
    };
  }, []); // <--- El array vacío es vital aquí

  const addToCart = useCallback(async () => {
    const sku = skuInput.trim().toUpperCase();
    if (!sku) return;

    if (showDropdown && searchResults.length > 0) {
      addProductToCart(searchResults[selectedIndex]);
      return;
    }

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

    addProductToCart(data as Product);
    setLoading(false);
  }, [skuInput, cart, showDropdown, searchResults, selectedIndex, addProductToCart]);

  // Manejo de teclas para navegación en dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === "Enter") {
        e.preventDefault();
        addToCart();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        break;
      case "Enter":
        e.preventDefault();
        addProductToCart(searchResults[selectedIndex]);
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

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
        cost_price_at_sale: i.cost_price,
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
        setOverlayMessage("Crédito Registrado");
      } else {
        setOverlayMessage("Venta Aprobada");
      }
      
      // Mostrar overlay de éxito y limpiar formulario
      setShowSuccessOverlay(true);
      
      // Limpiar formulario después de 1.5 segundos
      setTimeout(() => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setPaymentMethod("cash");
        setShowSuccessOverlay(false);
      }, 1500);
    } catch (err) {
      toast.error("Error al procesar la venta");
      console.error(err);
    } finally {
      setProcessing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* Header - Siempre arriba */}
        <div className="lg:col-span-12">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setIsScanning(true)}
              className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer group"
              title="Escanear código"
            >
              <ScanLine className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Punto de Venta
              </h1>
              <p className="text-xs text-slate-500 font-medium">Sistema de Facturación</p>
            </div>
          </div>
        </div>

        {/* Buscador - order-1 para móvil (primero) */}
        <div className="lg:col-span-8 order-1 lg:order-1">
          <section className="bg-slate-900/50 border border-slate-800 p-3 rounded-3xl">
            <div className="relative" ref={dropdownRef}>
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    ref={inputRef}
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Código o nombre del producto..."
                    className="w-full h-10 pl-12 pr-4 text-sm bg-slate-900 border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                    autoFocus
                    disabled={loading}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={addToCart} 
                  disabled={loading} 
                  className="h-10 px-5 bg-slate-200 hover:bg-white text-slate-900 font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border-0 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {/* Dropdown de resultados */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-2 bg-slate-900 border-b border-slate-800">
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <Package className="w-3 h-3" />
                      {searchResults.length} productos
                    </p>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {searchResults.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => addProductToCart(product)}
                        className={`w-full p-3 flex items-center gap-3 transition-colors text-left
                          ${index === selectedIndex 
                            ? 'bg-slate-700 border-l-2 border-slate-400' 
                            : 'hover:bg-slate-750 border-l-2 border-transparent'}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700">
                          <Package className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-200 font-mono">${product.final_price.toFixed(2)}</p>
                          <p className={`text-xs ${product.stock > 5 ? 'text-emerald-400' : product.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            Stock: {product.stock}
                          </p>
                        </div>
                        {index === selectedIndex && (
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 bg-slate-900/50 text-center text-xs text-cyan-500/50 border-t border-cyan-500/20">
                    Usa ↑↓ para navegar, Enter para seleccionar
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Carrito - order-3 para móvil (último) */}
        <div className="lg:col-span-8 order-3 lg:order-1">
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-slate-200">Productos</h2>
                <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs text-cyan-400">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Lista de productos */}
            <div className="divide-y divide-slate-800">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <ShoppingCart className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">Busca un producto</p>
                  <p className="text-slate-600 text-sm mt-1">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.sku} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-slate-200 truncate">{item.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                        </div>
                        <p className="font-semibold text-slate-200 font-mono">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-400 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-mono font-medium text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 font-mono">
                            ${item.unit_price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.sku)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Resumen de Pago - order-2 para móvil */}
        <div className="lg:col-span-4 order-2 lg:order-2">
          <aside className="sticky top-24 space-y-6">
            
            {/* Card de Total */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${loadingRate ? 'animate-spin' : ''}`} />
                    <h2 className="font-semibold text-slate-200">Resumen</h2>
                  </div>
                  <button
                    onClick={fetchRate}
                    disabled={loadingRate}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    title="Actualizar tasa"
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              {/* Total Principal */}
              <div className="p-5 text-center">
                <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Total a Pagar</p>
                <p className="text-4xl font-mono font-bold text-slate-100">
                  ${total.toFixed(2)}
                </p>
                
                {rate && totalBs > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <p className="text-4xl font-mono font-bold text-slate-100">
                      {formatBs(totalBs)}
                    </p>
                  </div>
                )}

                {/* Tasa BCV */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <span className="text-slate-500">Tasa:</span>
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
                      className="w-20 px-2 py-1 text-center font-mono bg-slate-950 border border-slate-700 rounded text-slate-300 focus:border-slate-500 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={handleRateClick}
                      className="font-mono text-slate-400 hover:text-slate-200 transition-colors"
                      title="Clic para editar"
                    >
                      {rate ? rate.usdToBs.toFixed(2) : "--"} Bs/USD
                    </button>
                  )}
                  {rate?.source === "api" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Tasa API" />
                  )}
                  {rate?.source === "manual" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Tasa Manual" />
                  )}
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div className="px-4 pb-4">
                <Label className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Método de Pago</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      paymentMethod === "cash"
                        ? "bg-slate-800/40 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        : "bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="font-medium text-sm">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("credit")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      paymentMethod === "credit"
                        ? "bg-slate-800/40 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        : "bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium text-sm">Fiado</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Campos de Cliente para Crédito */}
            {paymentMethod === "credit" && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-200 text-sm">Datos del Cliente</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName" className="text-xs text-slate-500 uppercase tracking-wider">
                      Nombre completo *
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 focus:border-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone" className="text-xs text-slate-500 uppercase tracking-wider">
                      Teléfono *
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0412-1234567"
                      className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 font-mono focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Procesar */}
            <Button
              onClick={processSale}
              disabled={cart.length === 0 || processing || (paymentMethod === "credit" && (!customerName.trim() || !customerPhone.trim()))}
              className="w-full h-14 text-base font-semibold rounded-xl border-0 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-slate-200 hover:bg-white text-slate-900 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : paymentMethod === "credit" ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Registrar Fiado
                  </>
                ) : (
                  <>
                    <Banknote className="w-5 h-5" />
                    Procesar Venta ${total.toFixed(2)}
                  </>
                )}
              </span>
            </Button>

            {/* Contador de items */}
            <p className="text-center text-sm text-slate-500">
              {cart.length} {cart.length === 1 ? "producto" : "productos"} en el carrito
            </p>

          </aside>
        </div>
      </div>

      {/* Overlay de Venta Exitosa */}
      <SaleSuccessOverlay 
        isOpen={showSuccessOverlay} 
        message={overlayMessage}
      />

      {/* Modal del Escáner - Local en POS */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onCodeDetected={(code) => {
            // Cerrar escáner inmediatamente
            setIsScanning(false);
            // Delegar al handler maestro que busca en BD y agrega al carrito
            handleCodeDetected(code);
          }}
        />
      )}
    </div>
  );
};

export default POS;
