import { createContext, useContext, useRef, ReactNode } from "react";

interface ScannerContextType {
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  onCodeDetected: (code: string | null | undefined) => void;
  setCodeHandler: (handler: ((code: string) => void) | null) => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider = ({ children }: { children: ReactNode }) => {
  const isScannerOpenRef = useRef(false);
  
  // USAMOS REF en lugar de useState. 
  // Esto hace que el handler sea persistente y no se pierda en renderizados.
  const codeHandlerRef = useRef<((code: string) => void) | null>(null);

  const openScanner = () => { isScannerOpenRef.current = true; };
  const closeScanner = () => { isScannerOpenRef.current = false; };

  const setCodeHandler = (handler: ((code: string) => void) | null) => {
    codeHandlerRef.current = handler;
  };

  const onCodeDetected = (code: string | null | undefined) => {
    if (!code || code.trim().length === 0) return;
    
    // Aquí está la magia: llamamos al ref directamente
    if (codeHandlerRef.current) {
      codeHandlerRef.current(code.trim());
    } else {
      console.warn("⚠️ [SCANNER] Lectura ignorada: No hay pantalla activa.");
    }
  };

  return (
    <ScannerContext.Provider value={{ 
      isScannerOpen: isScannerOpenRef.current, 
      openScanner, 
      closeScanner, 
      onCodeDetected, 
      setCodeHandler 
    }}>
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error("useScanner must be used within ScannerProvider");
  }
  return context;
};

export { ScannerContext };
