import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeDetected: (code: string) => void;
}

const BarcodeScanner = ({ isOpen, onClose, onCodeDetected }: BarcodeScannerProps) => {
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isReady = useRef(false); // Puerta de entrada: solo procesar si el componente está listo
  
  // 1. La "Memoria" de la cámara
  const lastScannedCode = useRef<string | null>(null);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

  // Función para reproducir beep
  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 1000; // Frecuencia del beep (1000Hz)
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (err) {
      console.error("Error al reproducir beep:", err);
    }
  };

  // Puerta de entrada: Pequeño delay para asegurar que el DOM esté listo
  useEffect(() => {
    if (!isOpen) {
      isReady.current = false;
      return;
    }
    
    const timer = setTimeout(() => { 
      isReady.current = true; 
    }, 500);
    
    return () => { 
      isReady.current = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Iniciar escáner cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !scannerRef.current) return;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("barcode-scanner-reader");
        setHtml5QrCode(scanner);
        
        const config = { 
          fps: 15, 
          qrbox: { width: 300, height: 200 },
          // ¡CRUCIAL! Esto permite que lea códigos de barras industriales, no solo QR
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ]
        };
        
        await scanner.start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            // Puerta de entrada: Si no estamos listos o el texto es inválido, NO HACER NADA
            if (!isReady.current || !decodedText || decodedText.trim() === "") {
                return; 
            }

            const cleanCode = decodedText?.trim();

            // QUITA EL FILTRO DE < 5. Muchos productos tienen códigos cortos.
            if (!cleanCode) return;

            // Si es el mismo de hace milisegundos, ignora (Memoria)
            if (cleanCode === lastScannedCode.current) return;

            // Si llega aquí, es un código real
            lastScannedCode.current = cleanCode;
            playBeep();
            
            console.log("🎯 Escáner leyendo:", cleanCode); // VERIFICACIÓN VISUAL
            onCodeDetected(cleanCode);

            // Reset de memoria rápido (2 segundos)
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => {
              lastScannedCode.current = null;
            }, 2000);
          },
          (error) => { 
            // Silencio total en errores de lectura (cuadros vacíos)
          }
        );
      } catch (err) {
        console.error("Error al iniciar escáner:", err);
        
        // Verificar si es error de permisos
        if (err instanceof Error && err.message.includes("Permission")) {
          toast.error("Se requiere acceso a la cámara para escanear códigos");
        } else {
          toast.error("No se pudo acceder a la cámara. Verifica los permisos.");
        }
        onClose();
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onClose, onCodeDetected]); // isProcessingRef no necesita estar en dependencias

  // Detener escáner
  const stopScanner = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        await html5QrCode.clear();
      } catch (err) {
        console.error("Error al detener escáner:", err);
      }
      setHtml5QrCode(null);
    }
  };

  // 2. Limpieza de memoria si se cierra la cámara
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  // Limpiar AudioContext al desmontar
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop oscuro translúcido */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal minimalista */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Escanear Código</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Área de escaneo */}
        <div className="p-4">
          <div 
            id="barcode-scanner-reader" 
            ref={scannerRef} 
            className="w-full rounded-xl overflow-hidden"
            style={{ minHeight: "300px" }}
          />
        </div>
        
        {/* Footer con instrucciones */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <p className="text-sm text-slate-400 text-center">
            Apunta la cámara al código de barras o QR
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
