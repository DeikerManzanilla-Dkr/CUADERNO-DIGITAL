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
  Wallet
} from "lucide-react";
import { useExchangeRate, formatBs, formatUsd } from "@/services/bcvService";
import { format } from "date-fns";
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
    const isPaid = newRemaining <= 0.01; // Margen para errores de punto flotante

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

  const openPaymentModal = (debt: Debt) => {
    setPaymentModal({
      isOpen: true,
      debt,
      amountUsd: debt.remaining_amount.toFixed(2),
    });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
          <p className="text-muted-foreground">Gestión de fiados y pagos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRate} disabled={loadingRate}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingRate ? "animate-spin" : ""}`} />
            {rate ? `${rate.usdToBs.toFixed(2)} Bs/USD` : "Actualizar tasa"}
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 pos-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total por Cobrar (USD)</p>
              <p className="text-2xl font-mono font-bold text-primary">{formatUsd(totalOwed)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 pos-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Equivalente en Bs</p>
              <p className="text-2xl font-mono font-bold">{rate ? formatBs(totalOwedBs) : "---"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nombre o teléfono..."
            className="pl-10 bg-card"
          />
        </div>
        <span className="text-sm text-muted-foreground font-mono">{filteredCustomers.length} clientes</span>
      </div>

      {/* Lista de Clientes con Deudas */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando deudas...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? "No se encontraron clientes" : "No hay deudas pendientes"}</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={`${customer.customer_name}-${customer.customer_phone}`} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header del Cliente */}
              <div className="p-4 border-b border-border bg-secondary/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{customer.customer_name}</h3>
                      {customer.customer_phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono">{customer.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deuda Total</p>
                    <p className="text-xl font-mono font-bold text-primary">{formatUsd(customer.total_owed)}</p>
                    {rate && (
                      <p className="text-sm font-mono text-muted-foreground">
                        {formatBs(customer.total_owed * rate.usdToBs)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de Deudas Individuales */}
              <div className="divide-y divide-border/50">
                {customer.debts.map((debt) => (
                  <div key={debt.id} className="p-3 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Fiado del {format(new Date(debt.created_at), "dd MMM yyyy", { locale: es })}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(debt.created_at), "HH:mm")}</span>
                          {debt.notes && <span>- {debt.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono font-semibold">{formatUsd(debt.remaining_amount)}</p>
                        {rate && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {formatBs(debt.remaining_amount * rate.usdToBs)}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => openPaymentModal(debt)}
                        className="gap-1"
                      >
                        Cobrar
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pago */}
      {paymentModal.isOpen && paymentModal.debt && rate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Registrar Pago</h3>
              <button
                onClick={() => setPaymentModal({ isOpen: false, debt: null, amountUsd: "" })}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-secondary/30 rounded-md">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{paymentModal.debt.customer_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-md">
                  <p className="text-sm text-muted-foreground">Deuda Original</p>
                  <p className="font-mono font-semibold">{formatUsd(paymentModal.debt.total_amount)}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="font-mono font-bold text-primary">{formatUsd(paymentModal.debt.remaining_amount)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount" className="text-xs uppercase tracking-wider">
                  Monto a Pagar (USD)
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModal.debt.remaining_amount}
                  value={paymentModal.amountUsd}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, amountUsd: e.target.value }))}
                  className="font-mono text-lg"
                  autoFocus
                />
                {parseFloat(paymentModal.amountUsd || "0") > paymentModal.debt.remaining_amount && (
                  <p className="text-xs text-destructive">El monto no puede exceder el saldo pendiente</p>
                )}
              </div>

              {/* Conversión a Bolívares usando tasa ACTUAL */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  Equivalente a cobrar en Bs (tasa actual)
                </p>
                <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-400">
                  {formatBs(parseFloat(paymentModal.amountUsd || "0") * rate.usdToBs)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Tasa: {rate.usdToBs.toFixed(2)} Bs/USD ({rate.source === "api" ? "BCV" : "Manual"})
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPaymentModal({ isOpen: false, debt: null, amountUsd: "" })}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePayment}
                  disabled={
                    !paymentModal.amountUsd ||
                    parseFloat(paymentModal.amountUsd) <= 0 ||
                    parseFloat(paymentModal.amountUsd) > paymentModal.debt.remaining_amount
                  }
                >
                  Confirmar Pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobros;
