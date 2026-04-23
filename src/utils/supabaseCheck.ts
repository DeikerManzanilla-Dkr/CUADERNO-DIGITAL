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

    console.log("🔍 Verificando conexión a Supabase...");
    console.log(`📍 URL: ${url}`);
    console.log(`📍 Project ID: ${projectId}`);

    // 2. Verificar autenticación
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      status.errors.push(`Error de autenticación: ${authError.message}`);
    } else {
      status.auth = true;
      console.log("✅ Autenticación: OK");
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
      console.log("✅ Base de datos: OK");
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

    if (status.tables.length > 0) {
      console.log(`✅ Tablas encontradas: ${status.tables.join(", ")}`);
    }

    status.connected = status.auth || status.database;

  } catch (error) {
    status.errors.push(`Error general: ${error}`);
  }

  return status;
}

export function printConnectionStatus(status: ConnectionStatus): void {
  console.log("\n📊 ESTADO DE CONEXIÓN SUPABASE:");
  console.log("================================");
  console.log(`🔗 Proyecto: ${status.projectId || "No configurado"}`);
  console.log(`🔐 Autenticación: ${status.auth ? "✅ OK" : "❌ Fallo"}`);
  console.log(`💾 Base de datos: ${status.database ? "✅ OK" : "❌ Fallo"}`);
  console.log(`📋 Tablas: ${status.tables.length > 0 ? status.tables.join(", ") : "Ninguna"}`);
  
  if (status.errors.length > 0) {
    console.log("\n⚠️  ERRORES ENCONTRADOS:");
    status.errors.forEach((err) => console.log(`  - ${err}`));
  }
  
  console.log("\n" + (status.connected ? "✅ Conexión establecida correctamente" : "❌ Problemas de conexión detectados"));
}
