import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  ArrowLeft, 
  Clock,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Configuración de métodos de pago
const PAYMENT_METHODS = [
  {
    id: "binance",
    name: "Binance Pay",
    icon: Wallet,
    color: "amber",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    details: {
      title: "Pago con Binance",
      instructions: [
        "Abre tu app de Binance",
        "Busca 'Pay' o 'Enviar'",
        "Escanea el QR o usa el ID",
        "Confirma el monto"
      ],
      qrCode: "binance_qr_placeholder",
      accountInfo: "ID Binance: 123456789"
    }
  },
  {
    id: "pagomovil",
    name: "Pago Móvil",
    icon: Smartphone,
    color: "blue",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    details: {
      title: "Pago Móvil Venezuela",
      instructions: [
        "Abre tu banco por Pago Móvil",
        "Selecciona 'A terceros'",
        "Ingresa los datos de abajo",
        "Confirma el monto"
      ],
      bankInfo: {
        bank: "Banco de Venezuela",
        phone: "0412-1234567",
        ci: "V-12345678",
        name: "CUADERNO DIGITAL C.A."
      }
    }
  }
];

interface PaymentPortalProps {
  userId: string;
  onPaymentSubmitted?: () => void;
  onBack?: () => void;
}

const PaymentPortal = ({ userId, onPaymentSubmitted, onBack }: PaymentPortalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedPayment = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod || !reference.trim() || !amount.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("payment_reports")
        .insert({
          user_id: userId,
          method: selectedMethod,
          reference: reference.trim().toUpperCase(),
          amount: parseFloat(amount),
          status: "pending"
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Reporte de pago enviado. Tu cuenta está en proceso de activación.");
      
      // Activar acceso de cortesía de 24 horas
      const courtesyExpiry = new Date();
      courtesyExpiry.setHours(courtesyExpiry.getHours() + 24);
      
      await supabase
        .from("profiles")
        .update({
          subscription_status: true,
          expires_at: courtesyExpiry.toISOString(),
          courtesy_access: true,
          courtesy_expires_at: courtesyExpiry.toISOString()
        })
        .eq("id", userId);

      onPaymentSubmitted?.();
    } catch (err) {
      console.error("Error al enviar pago:", err);
      toast.error("Error al procesar el reporte. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Pago Reportado!</h2>
          <p className="text-slate-400 mb-4">
            Tu reporte está en revisión. Mientras tanto, tienes acceso de cortesía por 24 horas.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <Clock className="w-4 h-4" />
            <span>Acceso activo hasta: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      {/* Panel Izquierdo - Info */}
      <div className="lg:w-1/2 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 lg:p-8 border-b border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center p-6 lg:p-12">
          <div className="max-w-md">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Licencia expirada
            </h1>
            <p className="text-lg text-slate-400 mb-6">
              Tu acceso está temporalmente limitado. Reporta tu pago para reactivar tu cuenta inmediatamente.
            </p>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Acceso de cortesía incluido</span>
              </div>
              <p className="text-xs text-slate-500">
                Al reportar tu pago, activamos automáticamente 24 horas de acceso completo mientras verificamos tu transacción.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Métodos de Pago */}
      <div className="lg:w-1/2 bg-slate-900 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          {!selectedMethod ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-6">Selecciona método de pago</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-6 rounded-xl border transition-all duration-200 text-left group ${method.bgColor} ${method.borderColor} hover:bg-slate-800`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 group-hover:border-${method.color}-500/50`}>
                      <method.icon className={`w-6 h-6 ${method.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{method.name}</h3>
                    <p className="text-sm text-slate-500">Click para ver datos</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              {/* Header con método seleccionado */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-xl ${selectedPayment?.bgColor} ${selectedPayment?.borderColor} border flex items-center justify-center`}>
                  {selectedPayment && <selectedPayment.icon className={`w-5 h-5 ${selectedPayment.iconColor}`} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPayment?.name}</h3>
                  <p className="text-sm text-slate-500">Reporta tu transferencia</p>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">
                  {selectedPayment?.details.title}
                </h4>
                <ol className="space-y-2 text-sm text-slate-400">
                  {selectedPayment?.details.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono">{idx + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Datos bancarios si es Pago Móvil */}
              {selectedMethod === "pagomovil" && selectedPayment?.details.bankInfo && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">Datos de transferencia</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Banco:</span>
                      <span className="text-slate-300">{selectedPayment.details.bankInfo.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Teléfono:</span>
                      <span className="text-slate-300 font-mono">{selectedPayment.details.bankInfo.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RIF/Cédula:</span>
                      <span className="text-slate-300 font-mono">{selectedPayment.details.bankInfo.ci}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nombre:</span>
                      <span className="text-slate-300">{selectedPayment.details.bankInfo.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario de reporte */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número de Referencia
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: 1234567890"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Monto enviado (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="15.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Reportar Pago
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-4">
                Tu pago será verificado en las próximas 2-4 horas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPortal;
