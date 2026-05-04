import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";

export interface CartItemType {
  product_id: string;
  sku: string;
  name: string;
  unit_price: number;
  base_price: number;
  iva_amount: number;
  cost_price: number;
  quantity: number;
  stock: number;
  sale_type: "unit" | "weight";
}

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (sku: string, delta: number, isAbsolute?: boolean) => void;
  removeItem: (sku: string) => void;
}

export const CartItem = ({ item, updateQuantity, removeItem }: CartItemProps) => {
  const [inputValue, setInputValue] = useState<string>(
    item.sale_type === "weight" ? item.quantity.toFixed(3) : String(item.quantity)
  );

  // Sync external changes
  useEffect(() => {
    const currentNum = parseFloat(inputValue);
    // Solo actualizar el input si el valor numérico cambió externamente (ej: botones + / -)
    if (isNaN(currentNum) || currentNum !== item.quantity) {
      if (item.quantity === 0 && document.activeElement?.id === `input-${item.sku}`) {
         // Si el valor es 0 y el input está activo, puede que el usuario esté borrando.
         // No forzamos un valor si el estado dice 0 pero el usuario está escribiendo.
         return;
      }
      setInputValue(item.sale_type === "weight" ? item.quantity.toFixed(3) : String(item.quantity));
    }
  }, [item.quantity, item.sale_type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Si el usuario borra todo, permitimos que quede en blanco visualmente pero enviamos 0
    if (val === "") {
      setInputValue("");
      updateQuantity(item.sku, 0, true);
      return;
    }

    if (item.sale_type === "weight") {
      // Permitir números con hasta 3 decimales, incluyendo "0."
      if (/^\d*\.?\d{0,3}$/.test(val)) {
        setInputValue(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
          updateQuantity(item.sku, num, true);
        }
      }
    } else {
      // Unit: solo enteros
      if (/^\d*$/.test(val)) {
        setInputValue(val);
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          updateQuantity(item.sku, num, true);
        }
      }
    }
  };

  const handleBlur = () => {
    let num = parseFloat(inputValue);
    if (isNaN(num)) num = 0;
    
    if (item.sale_type === "weight") {
      setInputValue(num.toFixed(3));
    } else {
      setInputValue(String(num));
    }
    updateQuantity(item.sku, num, true);
  };

  return (
    <div className="p-4 flex items-center gap-4">
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
          <div className="flex flex-col items-center gap-[2px] bg-slate-900/40 p-2 rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center gap-[2px]">
              <button
                onClick={() => updateQuantity(item.sku, item.sale_type === "weight" ? -0.1 : -1)}
                className="w-8 h-12 bg-black hover:bg-slate-900 active:bg-slate-700 border-l-2 border-slate-700 rounded-l-lg flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-10 relative"
                title={item.sale_type === "weight" ? "Restar 100g" : "Restar 1 unidad"}
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>

              <div className="w-20 h-14 bg-slate-950 rounded-md border border-slate-800 flex flex-col items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden mx-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest absolute top-1 pointer-events-none">
                  {item.sale_type === "weight" ? "KILOS" : "UNDS"}
                </span>
                <input
                  id={`input-${item.sku}`}
                  type="text"
                  inputMode="decimal"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full text-center font-mono font-bold text-cyan-400 bg-transparent border-none outline-none text-lg mt-3 z-10"
                />
              </div>

              <button
                onClick={() => updateQuantity(item.sku, item.sale_type === "weight" ? 0.1 : 1)}
                className="w-8 h-12 bg-black hover:bg-slate-900 active:bg-slate-700 border-r-2 border-slate-700 rounded-r-lg flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-10 relative"
                title={item.sale_type === "weight" ? "Sumar 100g" : "Sumar 1 unidad"}
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm text-slate-500 font-mono block">
                ${item.unit_price.toFixed(2)}/{item.sale_type === "weight" ? "kg" : "u"}
              </span>
              <span className="text-xs text-slate-600">
                {item.sale_type === "weight" ? "x" + item.quantity.toFixed(3) + "kg" : item.quantity + "u"}
              </span>
            </div>
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
  );
};
