import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  DollarSign, 
  Phone, 
  Calendar, 
  RefreshCw, 
  CheckCircle2,
  User,
  CreditCard,
  Search,
  ArrowRight,
  Wallet,
  Sparkles,
  BookOpen,
  Clock,
  AlertCircle,
  TrendingDown,
  X,
  Receipt
} from "lucide-react";
import { useExchangeRate, formatBs, formatUsd } from "@/services/bcvService";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Debt {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  remaining_amount: number;
  created_at: string;
  sale_id: string | null;
  notes: string | null;
}

interface PaymentModalState {
  isOpen: boolean;
  debt: Debt | null;
  amountUsd: string;
}

const Cobros = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    isOpen: false,
    debt: null,
    amountUsd: "",
  });
  
  const { rate, loading: loadingRate, fetchRate } = useExchangeRate();

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar deudas");
      console.error(error);
    } else {
      setDebts((data as Debt[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Agrupar deudas por cliente
  const debtsByCustomer = debts.reduce((acc, debt) => {
    const key = `${debt.customer_name}-${debt.customer_phone || ""}`;
    if (!acc[key]) {
      acc[key] = {
        customer_name: debt.customer_name,
        customer_phone: debt.customer_phone,
        debts: [],
        total_owed: 0,
      };
    }
    acc[key].debts.push(debt);
    acc[key].total_owed += debt.remaining_amount;
    return acc;
  }, {} as Record<string, { customer_name: string; customer_phone: string | null; debts: Debt[]; total_owed: number }>);

  const customers = Object.values(debtsByCustomer);

  // Filtrar por búsqueda
  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_phone && c.customer_phone.includes(search))
  );

  // Calcular totales
  const totalOwed = customers.reduce((sum, c) => sum + c.total_owed, 0);
  const totalOwedBs = rate ? totalOwed * rate.usdToBs : 0;

  const handlePayment = async () => {
    if (!paymentModal.debt || !paymentModal.amountUsd) return;
    
    const amount = parseFloat(paymentModal.amountUsd);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Monto inválido");
      return;
    }

    if (amount > paymentModal.debt.remaining_amount) {
      toast.error("El monto excede la deuda pendiente");
      return;
    }

    const newRemaining = paymentModal.debt.remaining_amount - amount;
    const isPaid = newRemaining <= 0.01;

    const { error } = await supabase
      .from("debts")
      .update({
        remaining_amount: isPaid ? 0 : newRemaining,
        status: isPaid ? "paid" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentModal.debt.id);

    if (error) {
      toast.error("Error al registrar pago");
      return;
    }

    toast.success(
      isPaid 
        ? `Pago completo registrado: ${formatUsd(amount)}` 
        : `Pago parcial registrado: ${formatUsd(amount)} - Restante: ${formatUsd(newRemaining)}`
    );

    setPaymentModal({ isOpen: false, debt: null, amountUsd: "" });
    fetchDebts();
  };

  // Determinar si la deuda está atrasada (más de 7 días)
  const isOverdue = (createdAt: string) => {
    const days = differenceInDays(new Date(), new Date(createdAt));
    return days > 7;
  };

  // Obtener color según antigüedad
  const getDebtAgeColor = (createdAt: string) => {
    const days = differenceInDays(new Date(), new Date(createdAt));
    if (days > 14) return { color: "red", label: `${days} días` };
    if (days > 7) return { color: "orange", label: `${days} días` };
    if (days > 3) return { color: "yellow", label: `${days} días` };
    return { color: "cyan", label: `${days} días` };
  };

  const openPaymentModal = (debt: Debt) => {
    setPaymentModal({
      isOpen: true,
      debt,
      amountUsd: debt.remaining_amount.toFixed(2),
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-6">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Cuentas por Cobrar
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestión de fiados y pagos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchRate} 
              disabled={loadingRate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRate ? "animate-spin" : ""}`} />
              <span className="font-mono text-sm">{rate ? `${rate.usdToBs.toFixed(2)} Bs` : "Tasa"}</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total por Cobrar */}
          <div className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredCustomers.length} clientes</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total por Cobrar</p>
            <p className="text-3xl font-mono font-bold text-slate-200">{formatUsd(totalOwed)}</p>
            {rate && <p className="mt-1 text-sm font-mono text-slate-500">{formatBs(totalOwedBs)}</p>}
          </div>

          {/* Deudas Atrasadas */}
          <div className={`rounded-xl p-5 border ${debts.filter(d => isOverdue(d.created_at)).length > 0 ? 'bg-amber-950/30 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${debts.filter(d => isOverdue(d.created_at)).length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800 border-slate-700'}`}>
                <Clock className={`w-5 h-5 ${debts.filter(d => isOverdue(d.created_at)).length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              </div>
            </div>
            <p className={`text-xs uppercase tracking-wider mb-1 ${debts.filter(d => isOverdue(d.created_at)).length > 0 ? 'text-amber-400' : 'text-slate-500'}`}>Deudas Atrasadas</p>
            <p className={`text-2xl font-mono font-bold ${debts.filter(d => isOverdue(d.created_at)).length > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {debts.filter(d => isOverdue(d.created_at)).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">+7 días sin abono</p>
          </div>

          {/* Promedio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Promedio/Cliente</p>
            <p className="text-2xl font-mono font-bold text-slate-200">
              {filteredCustomers.length > 0 ? formatUsd(totalOwed / filteredCustomers.length) : "$0.00"}
            </p>
            <p className="text-xs text-slate-500 mt-1">deuda promedio</p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nombre o teléfono..."
            className="w-full pl-12 pr-4 h-12 bg-slate-900 border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:border-slate-700 focus:ring-1 focus:ring-slate-600"
          />
        </div>

        {/* Grid de Tarjetas de Deudores */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700/50" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium text-lg">
              {search ? "No se encontraron clientes" : "¡Todas las cuentas están al día!"}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {search ? "Intenta con otro término de búsqueda" : "No hay deudas pendientes"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCustomers.map((customer) => {
              const ageInfo = customer.debts[customer.debts.length - 1] 
                ? getDebtAgeColor(customer.debts[customer.debts.length - 1].created_at) 
                : { color: "slate", label: "Nuevo" };
              const hasOverdue = customer.debts.some(d => isOverdue(d.created_at));
              
              return (
                <div 
                  key={`${customer.customer_name}-${customer.customer_phone}`}
                  className={`rounded-xl border overflow-hidden ${
                    hasOverdue ? "bg-amber-950/20 border-amber-500/20" : "bg-slate-900 border-slate-800"
                  }`}
                >
                  {/* Header */}
                  <div className={`p-4 border-b ${hasOverdue ? "border-amber-500/20 bg-amber-500/5" : "border-slate-800"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                          hasOverdue ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-800 border-slate-700"
                        }`}>
                          {hasOverdue ? (
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${hasOverdue ? "text-amber-100" : "text-slate-200"}`}>
                            {customer.customer_name}
                          </h3>
                          {customer.customer_phone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{customer.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        ageInfo.color === "red" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        ageInfo.color === "orange" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        ageInfo.color === "yellow" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                        "bg-slate-700 text-slate-300"
                      }`}>
                        {ageInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Deudas */}
                  <div className="divide-y divide-slate-800">
                    {customer.debts.slice(0, 2).map((debt) => {
                      const paidPercent = ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100;
                      
                      return (
                        <div key={debt.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-300">
                                {format(new Date(debt.created_at), "dd MMM yyyy", { locale: es })}
                              </p>
                              {paidPercent > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paidPercent}%` }} />
                                  </div>
                                  <span className="text-xs text-emerald-400">{paidPercent.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-medium text-slate-200">{formatUsd(debt.remaining_amount)}</p>
                            {debt.remaining_amount < debt.total_amount && (
                              <p className="text-xs text-slate-600 line-through">{formatUsd(debt.total_amount)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {customer.debts.length > 2 && (
                      <div className="px-3 py-2 text-center text-xs text-slate-500">
                        +{customer.debts.length - 2} deudas más
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={`p-4 border-t ${hasOverdue ? "border-amber-500/20 bg-amber-500/5" : "border-slate-800"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total adeudado</p>
                        <p className={`text-xl font-mono font-bold ${hasOverdue ? "text-amber-400" : "text-slate-200"}`}>
                          {formatUsd(customer.total_owed)}
                        </p>
                      </div>
                      <Button 
                        onClick={() => openPaymentModal(customer.debts[0])}
                        className="h-10 px-5 rounded-lg bg-slate-200 hover:bg-white text-slate-900 font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border-0"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Abonar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {paymentModal.isOpen && paymentModal.debt && rate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Registrar Abono</h3>
                  <p className="text-xs text-slate-500">{paymentModal.debt.customer_name}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModal({ isOpen: false, debt: null, amountUsd: "" })}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info de deuda */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Deuda Original</p>
                <p className="font-mono text-slate-400">{formatUsd(paymentModal.debt.total_amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Saldo Pendiente</p>
                <p className="font-mono font-semibold text-slate-200">{formatUsd(paymentModal.debt.remaining_amount)}</p>
              </div>
            </div>

            {/* Input de monto */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount" className="text-xs text-slate-500 uppercase tracking-wider">
                Monto a Pagar (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg">$</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModal.debt.remaining_amount}
                  value={paymentModal.amountUsd}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, amountUsd: e.target.value }))}
                  className="pl-8 pr-4 py-3 bg-slate-950 border-slate-700 text-slate-200 font-mono text-lg rounded-lg focus:border-slate-500"
                  autoFocus
                />
              </div>
              {parseFloat(paymentModal.amountUsd || "0") > paymentModal.debt.remaining_amount && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  El monto no puede exceder el saldo pendiente
                </p>
              )}
            </div>

            {/* Conversión a Bolívares */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
              <p className="text-xs text-emerald-500/70 uppercase tracking-wider mb-2">
                Equivalente en Bolívares
              </p>
              <p className="text-2xl font-mono font-bold text-emerald-400">
                {formatBs(parseFloat(paymentModal.amountUsd || "0") * rate.usdToBs)}
              </p>
              <p className="text-xs text-emerald-500/50 mt-1">
                Tasa: {rate.usdToBs.toFixed(2)} Bs/USD
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-lg border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setPaymentModal({ isOpen: false, debt: null, amountUsd: "" })}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-11 rounded-lg bg-slate-200 hover:bg-white text-slate-900 font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border-0"
                onClick={handlePayment}
                disabled={
                  !paymentModal.amountUsd ||
                  parseFloat(paymentModal.amountUsd) <= 0 ||
                  parseFloat(paymentModal.amountUsd) > paymentModal.debt.remaining_amount
                }
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Confirmar Pago
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobros;
