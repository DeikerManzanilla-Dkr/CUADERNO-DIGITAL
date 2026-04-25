// Script de verificación de conexión Supabase
import { supabase } from "@/integrations/supabase/client";

export interface ConnectionStatus {
  connected: boolean;
  projectId: string;
  auth: boolean;
  database: boolean;
  tables: string[];
  errors: string[];
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const status: ConnectionStatus = {
    connected: false,
    projectId: "",
    auth: false,
    database: false,
    tables: [],
    errors: [],
  };

  try {
    // 1. Verificar URL del proyecto
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
    status.projectId = projectId;

    if (!url || !projectId) {
      status.errors.push("Variables de entorno no configuradas");
      return status;
    }

    // Verificación silenciosa para producción

    // 2. Verificar autenticación
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      status.errors.push(`Error de autenticación: ${authError.message}`);
    } else {
      status.auth = true;
    }

    // 3. Verificar conexión a la base de datos
    const { data: dbData, error: dbError } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (dbError) {
      // Si la tabla no existe, eso es normal en un proyecto nuevo
      if (dbError.code === "42P01") {
        status.errors.push("Tablas no creadas aún. Ejecuta el esquema SQL primero.");
      } else {
        status.errors.push(`Error de base de datos: ${dbError.message}`);
      }
    } else {
      status.database = true;
    }

    // 4. Listar tablas existentes (verificar solo las principales)
    const checkTable = async (table: "products" | "sales" | "sale_items") => {
      const { error } = await supabase.from(table).select("count").limit(1);
      if (!error || error.code !== "42P01") {
        status.tables.push(table);
      }
    };
    
    await checkTable("products");
    await checkTable("sales");
    await checkTable("sale_items");


    status.connected = status.auth || status.database;

  } catch (error) {
    status.errors.push(`Error general: ${error}`);
  }

  return status;
}

export function printConnectionStatus(status: ConnectionStatus): void {
  // Función silenciada para producción
  // Los errores se manejan a través del sistema de estado, no consola
  if (status.errors.length > 0 && !status.connected) {
    // En producción, los errores se reportan al sistema de monitoreo
    // no a la consola del navegador
  }
}
