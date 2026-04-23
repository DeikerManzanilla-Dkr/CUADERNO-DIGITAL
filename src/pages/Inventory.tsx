import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package, Plus, Search } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  cost_price: number;
  base_price: number;
  iva_amount: number;
  final_price: number;
  stock: number;
}

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const IVA_RATE = 0.16;

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editingExisting, setEditingExisting] = useState(false);

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
      setEditingExisting(true);
      toast.info(`Producto existente: "${data.name}" — Stock actual: ${data.stock}`);
    } else {
      setEditingExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuVal = sku.trim().toUpperCase();
    if (!skuVal || !name.trim() || !costPrice || !finalPrice || !quantity) {
      toast.error("Todos los campos son obligatorios");
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
            stock: existing.stock + parseInt(quantity),
          })
          .eq("sku", skuVal);

        if (error) {
          toast.error("Error al actualizar producto");
        } else {
          toast.success(`Stock actualizado: +${quantity} unidades`);
        }
      }
    } else {
      const { error } = await supabase.from("products").insert({
        sku: skuVal,
        name: name.trim(),
        cost_price: parseFloat(costPrice),
        base_price: basePrice,
        iva_amount: ivaAmount,
        final_price: finalPriceNum,
        sale_price: finalPriceNum, // mantener compatibilidad
        stock: parseInt(quantity),
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
    setEditingExisting(false);
    setSaving(false);
    fetchProducts();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      {/* Entry Form */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border border-border bg-card p-6 space-y-5 pos-glow">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Ingreso de Mercancía</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs text-muted-foreground uppercase tracking-wider">Código / SKU</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} onBlur={() => checkSku(sku)} placeholder="Ej: PROD-001" className="font-mono bg-background" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider">Nombre del Producto</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto" className="bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost" className="text-xs text-muted-foreground uppercase tracking-wider">Costo</Label>
                <Input id="cost" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" className="font-mono bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs text-muted-foreground uppercase tracking-wider">Precio Venta Final </Label>
                <Input id="price" type="number" step="0.01" min="0" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} placeholder="0.00" className="font-mono bg-background" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-xs text-muted-foreground uppercase tracking-wider">Cantidad</Label>
              <Input id="qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Cantidad a ingresar" className="font-mono bg-background" />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Guardando..." : editingExisting ? "Actualizar Stock y Precios" : "Registrar Producto"}
            </Button>
            {editingExisting && (
              <p className="text-xs text-primary text-center">✓ Producto existente — se sumará la cantidad al stock</p>
            )}
          </form>
        </div>
      </div>

      {/* Product List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos..." className="pl-10 bg-card" />
          </div>
          <span className="text-sm text-muted-foreground font-mono">{filtered.length} productos</span>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Costo</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No hay productos registrados</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-sm text-primary">{p.sku}</td>
                    <td className="p-3 text-sm font-medium">{p.name}</td>
                    <td className="p-3 text-right font-mono text-sm text-muted-foreground">${Number(p.cost_price).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-sm">${Number(p.final_price).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span className={`font-mono text-sm font-semibold ${p.stock <= 5 ? "text-destructive" : p.stock <= 20 ? "text-warning" : "text-success"}`}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
