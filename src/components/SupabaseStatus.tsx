import { useEffect, useState } from "react";
import { checkSupabaseConnection, ConnectionStatus, printConnectionStatus } from "@/utils/supabaseCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Database, Server, Shield } from "lucide-react";

export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    const result = await checkSupabaseConnection();
    setStatus(result);
    printConnectionStatus(result);
    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Estado de Conexión Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Verificando conexión...</span>
          </div>
        )}

        {!loading && status && (
          <div className="space-y-3">
            {/* Estado general */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Estado General</span>
              <Badge variant={status.connected ? "default" : "destructive"}>
                {status.connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>

            {/* Project ID */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Proyecto ID</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {status.projectId || "No configurado"}
              </code>
            </div>

            {/* Detalles de conexión */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Autenticación</span>
                {status.auth ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>Base de Datos</span>
                {status.database ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                )}
              </div>
            </div>

            {/* Tablas */}
            {status.tables.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Tablas configuradas:</p>
                <div className="flex flex-wrap gap-1">
                  {status.tables.map((table) => (
                    <Badge key={table} variant="secondary" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Errores */}
            {status.errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">Errores:</p>
                <ul className="text-sm space-y-1">
                  {status.errors.map((error, i) => (
                    <li key={i} className="text-destructive">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Última verificación */}
            {lastChecked && (
              <p className="text-xs text-muted-foreground text-center">
                Última verificación: {lastChecked.toLocaleTimeString()}
              </p>
            )}

            <Button 
              onClick={checkConnection} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar nuevamente"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
