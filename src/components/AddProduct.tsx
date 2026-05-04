import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScanLine, Package, DollarSign, Tag, Archive, Plus, X } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";

interface AddProductProps {
  onProductAdded?: () => void;
  onClose?: () => void;
}

const SALE_TYPES = [
  { id: "unit", name: "Entero", description: "Venta por unidad (números enteros)" },
  { id: "weight", name: "Fraccionado", description: "Venta por peso/granel (permite decimales)" },
];

const AddProduct = ({ onProductAdded, onClose }: AddProductProps) => {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saleType, setSaleType] = useState<"unit" | "weight">("unit");
  const [isScanning, setIsScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<"none" | "text">("none");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const IVA_RATE = 0.16;

  // Calcular base_price y iva_amount desde final_price
  const calculateIvaFromFinal = (final: number) => {
    const base = final / (1 + IVA_RATE);
    const iva = final - base;
    return { base: Math.round(base * 100) / 100, iva: Math.round(iva * 100) / 100 };
  };

  // Función para activar el teclado manualmente cuando el usuario toca el input
  const handleManualInput = () => {
    setInputMode("text");
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Función que recibe el código del escáner
  const handleScanResult = (code: string) => {
    setBarcode(code);
    setIsScanning(false);
    // Limpiar foco para evitar teclado móvil
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    barcodeInputRef.current?.blur();
    setInputMode("none");
    toast.success(`Código escaneado: ${code}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const skuVal = barcode.trim().toUpperCase();
    if (!skuVal || !name.trim() || !costPrice || !finalPrice || !stock) {
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

    // Verificar si el producto ya existe
    const { data: existing } = await supabase
      .from("products")
      .select("id, stock, name")
      .eq("sku", skuVal)
      .maybeSingle();

    if (existing) {
      // Producto existente - actualizar stock
      const { error } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          cost_price: parseFloat(costPrice),
          base_price: basePrice,
          iva_amount: ivaAmount,
          final_price: finalPriceNum,
          sale_price: finalPriceNum,
          stock: existing.stock + parseInt(stock),
          sale_type: saleType,
          user_id: user.id,
        })
        .eq("id", existing.id);

      if (error) {
        toast.error("Error al actualizar producto");
        console.error(error);
      } else {
        toast.success(`Stock actualizado: ${existing.name} (+${stock} unidades)`);
        resetForm();
        onProductAdded?.();
      }
    } else {
      // Producto nuevo
      const { error } = await supabase
        .from("products")
        .insert({
          sku: skuVal,
          name: name.trim(),
          cost_price: parseFloat(costPrice),
          base_price: basePrice,
          iva_amount: ivaAmount,
          final_price: finalPriceNum,
          sale_price: finalPriceNum,
          stock: parseInt(stock),
          sale_type: saleType,
          user_id: user.id,
        });

      if (error) {
        toast.error("Error al crear producto");
        console.error(error);
      } else {
        toast.success(`Producto creado: ${name}`);
        resetForm();
        onProductAdded?.();
      }
    }

    setSaving(false);
  };

  const resetForm = () => {
    setBarcode("");
    setName("");
    setCostPrice("");
    setFinalPrice("");
    setStock("");
    setSaleType("unit");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Nuevo Producto</h2>
            <p className="text-xs text-slate-500">Escanea o ingresa manualmente</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Código de Barras con Escáner */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Código de Barras / SKU
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onFocus={handleManualInput}
                inputMode={inputMode}
                placeholder="Escanee o escriba el código..."
                className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="px-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-slate-700 transition-all group"
              title="Escanear código"
            >
              <ScanLine className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Nombre del Producto
          </label>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Arroz Premium 1kg"
              className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Estilo de Cálculo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Estilo de Cálculo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SALE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSaleType(type.id as "unit" | "weight")}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  saleType === type.id
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold">{type.name}</span>
                  <span className="text-xs opacity-70">{type.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Precio de Costo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3.5 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Precio de Venta
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3.5 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Stock Inicial
          </label>
          <div className="relative">
            <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Cantidad disponible"
              className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-xl text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-900 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
        >
          {saving ? (
            <>
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Guardar Producto
            </>
          )}
        </button>
      </form>

      {/* Modal del Escáner */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onCodeDetected={handleScanResult}
        />
      )}
    </div>
  );
};

export default AddProduct;
