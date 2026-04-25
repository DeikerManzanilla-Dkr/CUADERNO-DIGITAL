import { CheckCircle2 } from "lucide-react";

interface SaleSuccessOverlayProps {
  isOpen: boolean;
  message?: string;
}

const SaleSuccessOverlay = ({ isOpen, message = "Venta Aprobada" }: SaleSuccessOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-300">
        {/* Círculo verde con check */}
        <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/50 animate-in scale-in duration-500">
          <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={2} />
        </div>
        
        {/* Texto */}
        <h2 className="text-4xl font-bold text-white drop-shadow-lg tracking-tight">
          {message}
        </h2>
      </div>
    </div>
  );
};

export default SaleSuccessOverlay;
