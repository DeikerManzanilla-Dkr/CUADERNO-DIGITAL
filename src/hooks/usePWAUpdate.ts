import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook para detectar y forzar actualizaciones de la PWA
 * Escucha cambios en el Service Worker y muestra notificación para recargar
 */
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      // Enviar mensaje al SW para que haga skipWaiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Recargar la página para cargar la nueva versión
      window.location.reload();
    }
  }, [waitingWorker]);

  useEffect(() => {
    // Solo ejecutar en producción y si el navegador soporta SW
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const handleServiceWorkerUpdate = async () => {
      try {
        registration = await navigator.serviceWorker.ready;

        // Escuchar nuevas actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Cuando el nuevo SW está esperando (instalado pero no activo)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nueva versión disponible');
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);

              // Mostrar toast con botón de actualización
              toast.info('Nueva versión disponible', {
                description: 'Hay actualizaciones importantes. Toca el botón para recargar.',
                duration: 0, // No se cierra automáticamente
                action: {
                  label: 'Actualizar ahora',
                  onClick: () => updateServiceWorker(),
                },
                onDismiss: () => {
                  // Guardar en localStorage que hay update pendiente
                  localStorage.setItem('pwa-update-pending', 'true');
                },
              });
            }
          });
        });

        // Verificar si hay updates pendientes de sesiones anteriores
        if (localStorage.getItem('pwa-update-pending') === 'true') {
          // Limpiar el flag
          localStorage.removeItem('pwa-update-pending');
          
          // Si hay un SW esperando, actualizar
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setUpdateAvailable(true);
          }
        }

        // Verificar updates cada 60 minutos (para sesiones largas)
        const checkInterval = setInterval(() => {
          registration?.update().catch(console.error);
        }, 60 * 60 * 1000);

        return () => clearInterval(checkInterval);
      } catch (error) {
        console.error('[PWA] Error al registrar update handler:', error);
      }
    };

    handleServiceWorkerUpdate();

    // También escuchar mensajes del SW (para updates forzados)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        setUpdateAvailable(true);
        toast.info('Actualización lista', {
          description: 'Una nueva versión se ha descargado. Recarga para aplicarla.',
          action: {
            label: 'Recargar',
            onClick: updateServiceWorker,
          },
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [updateServiceWorker]);

  return { updateAvailable, updateServiceWorker, waitingWorker };
}
