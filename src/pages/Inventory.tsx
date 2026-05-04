import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  Search, 
  Sparkles, 
  ShoppingBag, 
  Beef, 
  Coffee, 
  Edit3, 
  History, 
  AlertTriangle,
  Archive,
  ChevronRight,
  X,
  ScanLine
} from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { playBeep } from "@/utils/audio";

interface Product {
  id: string;
  sku: string;
  name: string;
  cost_price: number;
  base_price: number;
  iva_amount: number;
  final_price: number;
  stock: number;
  category?: string;
}

const CATEGORIES = [
  { id: "all", name: "Todos", icon: ShoppingBag, color: "cyan" },
  { id: "viveres", name: "Víveres", icon: Package, color: "emerald" },
  { id: "charcuteria", name: "Charcutería", icon: Beef, color: "orange" },
  { id: "bebidas", name: "Bebidas", icon: Coffee, color: "blue" },
];

const getCategoryIcon = (category?: string) => {
  const cat = CATEGORIES.find(c => c.id === category);
  return cat?.icon || Package;
};

const getCategoryColor = (category?: string) => {
  const cat = CATEGORIES.find(c => c.id === category);
  return cat?.color || "cyan";
};

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const IVA_RATE = 0.16;

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("viveres");
  const [editingExisting, setEditingExisting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Calcular base_price y iva_amount desde final_price
  const calculateIvaFromFinal = (final: number) => {
    const base = final / (1 + IVA_RATE);
    const iva = final - base;
    return { base: Math.round(base * 100) / 100, iva: Math.round(iva * 100) / 100 };
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const checkSku = async (skuValue: string) => {
    if (!skuValue.trim()) {
      setEditingExisting(false);
      return;
    }
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("sku", skuValue.trim().toUpperCase())
      .maybeSingle();

    if (data) {
      setName(data.name);
      setCostPrice(String(data.cost_price));
      setFinalPrice(String(data.final_price || data.sale_price));
      setCategory(data.category || "viveres");
      setQuantity("0");
      setEditingExisting(true);
      toast.info(`Producto existente: "${data.name}" — Stock actual: ${data.stock}`);
    } else {
      setEditingExisting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSku(product.sku);
    setName(product.name);
    setCostPrice(String(product.cost_price));
    setFinalPrice(String(product.final_price));
    setCategory(product.category || "viveres");
    setQuantity("0");
    setEditingExisting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuVal = sku.trim().toUpperCase();
    const qtyNum = parseInt(quantity) || 0;

    if (!skuVal || !name.trim() || !costPrice || !finalPrice) {
      toast.error("SKU, nombre, costo y precio son obligatorios");
      return;
    }
    if (qtyNum < 0) {
      toast.error("La cantidad no puede ser negativa");
      return;
    }
    if (!editingExisting && qtyNum <= 0) {
      toast.error("La cantidad inicial debe ser mayor a 0 para nuevos productos");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("No autenticado");
      setSaving(false);
      return;
    }

    const finalPriceNum = parseFloat(finalPrice);
    const { base: basePrice, iva: ivaAmount } = calculateIvaFromFinal(finalPriceNum);

    if (editingExisting) {
      const { data: existing } = await supabase
        .from("products")
        .select("stock")
        .eq("sku", skuVal)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            cost_price: parseFloat(costPrice),
            base_price: basePrice,
            iva_amount: ivaAmount,
            final_price: finalPriceNum,
            sale_price: finalPriceNum, // mantener compatibilidad
            stock: existing.stock + qtyNum,
            category,
          })
          .eq("sku", skuVal);

        if (error) {
          toast.error("Error al actualizar producto");
        } else {
          toast.success(`Producto actualizado. Stock sumado: +${qtyNum}`);
        }
      } else {
        setEditingExisting(false);
        setSaving(false);
        toast.error("El producto no existe, intente registrarlo de nuevo");
        return;
      }
    } else {
      const { error } = await supabase.from("products").insert({
        sku: skuVal,
        name: name.trim(),
        cost_price: parseFloat(costPrice),
        base_price: basePrice,
        iva_amount: ivaAmount,
        final_price: finalPriceNum,
        sale_price: finalPriceNum,
        stock: qtyNum,
        category,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("El código SKU ya existe");
        } else {
          toast.error("Error al registrar producto");
        }
      } else {
        toast.success("Producto registrado exitosamente");
      }
    }

    setSku("");
    setName("");
    setCostPrice("");
    setFinalPrice("");
    setQuantity("");
    setCategory("viveres");
    setEditingExisting(false);
    setSaving(false);
    fetchProducts();
  };

  const filtered = products.filter(
    (p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

  const lowStockCount = products.filter(p => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* Formulario de Ingreso */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsScanning(true)}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group cursor-pointer"
                title="Escanear código"
              >
                <ScanLine className="w-6 h-6 text-slate-300 group-hover:text-cyan-400 transition-colors" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  Inventario
                </h1>
                <p className="text-xs text-slate-500 font-medium">Gestión de Productos</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-slate-400" />
                </div>
                <h2 className="font-semibold text-slate-200">Ingreso de Mercancía</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku" className="text-xs text-slate-500 uppercase tracking-wider">Código / SKU</Label>
                  <Input 
                    id="sku" 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value.toUpperCase())} 
                    onBlur={() => checkSku(sku)} 
                    placeholder="Ej: PROD-001" 
                    className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                    autoFocus 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-slate-500 uppercase tracking-wider">Nombre del Producto</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nombre del producto" 
                    className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                  />
                </div>

                {/* Selector de Categoría */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Categoría</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all duration-200 ${
                          category === cat.id
                            ? "bg-slate-700 border-slate-500 text-slate-200 shadow-md"
                            : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-500"
                        }`}
                      >
                        <cat.icon className={`w-4 h-4 ${category === cat.id ? "text-slate-300" : "text-slate-600"}`} />
                        <span className={`text-[10px] font-medium ${category === cat.id ? "text-slate-200" : "text-slate-500"}`}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cost" className="text-xs text-slate-500 uppercase tracking-wider">Costo</Label>
                    <Input 
                      id="cost" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={costPrice} 
                      onChange={(e) => setCostPrice(e.target.value)} 
                      placeholder="0.00" 
                      className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs text-slate-500 uppercase tracking-wider">Precio Venta</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={finalPrice} 
                      onChange={(e) => setFinalPrice(e.target.value)} 
                      placeholder="0.00" 
                      className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                    />
                  </div>
                </div>
                
                {costPrice && finalPrice && !isNaN(parseFloat(finalPrice) - parseFloat(costPrice)) && (
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Ganancia</span>
                    <span className={`font-mono font-medium ${parseFloat(finalPrice) - parseFloat(costPrice) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${(parseFloat(finalPrice) - parseFloat(costPrice)).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="qty" className="text-xs text-slate-500 uppercase tracking-wider">
                    {editingExisting ? "Sumar al Stock (0 para omitir)" : "Cantidad Inicial"}
                  </Label>
                  <Input 
                    id="qty" 
                    type="number" 
                    min="0" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    placeholder="Cantidad" 
                    className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg h-11 font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-lg bg-slate-200 hover:bg-white text-slate-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border-0" 
                  disabled={saving}
                >
                  {saving ? "Guardando..." : editingExisting ? "Actualizar Producto" : "Registrar Producto"}
                </Button>
                
                {editingExisting && (
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <Archive className="w-4 h-4 text-slate-500" />
                    <p className="text-xs text-slate-400 text-center">Producto existente — se sumará al stock</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Header y Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-200 text-lg">Productos</h2>
                <p className="text-xs text-slate-500">{filtered.length} productos en inventario</p>
              </div>
              {lowStockCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-400 font-medium">{lowStockCount} con stock bajo</span>
                </div>
              )}
            </div>
            
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Buscar productos..." 
                className="w-full pl-12 pr-4 h-12 bg-slate-900/50 border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
              />
            </div>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "bg-slate-700 border-slate-500 text-slate-100 shadow-md"
                    : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${selectedCategory === cat.id ? "bg-slate-600 text-slate-200" : "bg-slate-800 text-slate-500"}`}>
                  {cat.id === "all" ? products.length : products.filter(p => p.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Lista de Productos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium text-lg">No hay productos registrados</p>
              <p className="text-slate-500 text-sm mt-2">Agrega tu primer producto usando el formulario</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p, index) => {
                const isLowStock = p.stock <= 5;
                const isHovered = hoveredProduct === p.id;
                const CategoryIcon = getCategoryIcon(p.category);
                
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredProduct(p.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    className="animate-in fade-in duration-300"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Vista Desktop: Tarjeta completa */}
                    <div className={`h-full rounded-xl border transition-all duration-200 overflow-hidden ${
                      isLowStock
                        ? "bg-slate-900 border-amber-500/30 shadow-lg"
                        : isHovered
                          ? "bg-slate-800 border-slate-600 shadow-lg transform -translate-y-0.5"
                          : "bg-slate-900/80 border-slate-800"
                    }`}>
                      
                      {/* Header de la tarjeta */}
                      <div className={`p-4 border-b ${isLowStock ? "border-amber-500/20 bg-amber-500/5" : "border-slate-800"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                              isLowStock 
                                ? "bg-amber-500/10 border-amber-500/20" 
                                : "bg-slate-800 border-slate-700"
                            }`}>
                              {isLowStock ? (
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                              ) : (
                                <CategoryIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-200 truncate">{p.name}</h3>
                              <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                            </div>
                          </div>
                          
                          {/* Badge de Stock */}
                          <div className={`px-2.5 py-1 rounded-md border font-mono text-xs font-medium ${
                            isLowStock
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : p.stock <= 20
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}>
                            {p.stock}
                          </div>
                        </div>
                      </div>

                      {/* Cuerpo de la tarjeta */}
                      <div className="p-4 space-y-3">
                        {/* Precios */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Costo</p>
                            <p className="font-mono font-medium text-slate-400">${Number(p.cost_price).toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">Precio</p>
                            <p className="font-mono font-semibold text-slate-200">${Number(p.final_price).toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Ganancia */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Ganancia</span>
                            <span className="font-mono font-medium text-emerald-400">
                              +${(p.final_price - p.cost_price).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className={`flex gap-2 transition-all duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                          <button 
                            onClick={() => handleEdit(p)}
                            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors text-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                            <History className="w-4 h-4" />
                            Historial
                          </button>
                        </div>
                      </div>

                      {/* Footer con alerta */}
                      {isLowStock && (
                        <div className="px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-amber-400 font-medium">Stock crítico - Reponer</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal del Escáner */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onCodeDetected={(code) => {
            // BLINDAJE: Validar código antes de procesar
            if (!code || typeof code !== 'string') {
              console.warn("⚠️ [INVENTORY] Código inválido recibido:", code);
              return;
            }
            
            const trimmedCode = code.trim();
            
            // BLINDAJE: Ignorar si está vacío después de trim
            if (trimmedCode.length === 0) {
              console.warn("⚠️ [INVENTORY] Código vacío, ignorando");
              return;
            }
            
            // Feedback INMEDIATO (Beep)
            playBeep();
            
            setSku(trimmedCode);
            setIsScanning(false);
            checkSku(trimmedCode);
            toast.success(`Código escaneado: ${trimmedCode}`);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
