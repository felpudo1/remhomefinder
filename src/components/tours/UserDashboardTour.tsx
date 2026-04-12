/**
 * Tour guiado para el Dashboard de Usuario.
 * Usa driver.js para mostrar un recorrido interactivo por las secciones principales.
 *
 * Se ejecuta automáticamente la primera vez que el usuario entra al dashboard.
 * El usuario puede repetirlo desde el botón de ayuda (?) en el header.
 */

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

/** Clave para guardar en localStorage si el usuario ya vio el tour */
const TOUR_SEEN_KEY = "user-dashboard-tour-seen";

/**
 * Instancia del driver de tour.
 * Se crea una vez y se reutiliza para mostrar el tour cuando sea necesario.
 */
let tourInstance: Driver | null = null;

/**
 * Helper para hacer scroll al top de la página
 */
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Helper para esperar un tiempo y luego ejecutar una función
 */
const waitAndExecute = (ms: number, fn: () => void) => {
  setTimeout(fn, ms);
};

/**
 * Crea y configura la instancia del tour guiado.
 *
 * @returns La instancia del driver configurada
 */
export function createDashboardTour(): Driver {
  // Overlay personalizado para el botón de agregar propiedad
  let customOverlay: HTMLElement | null = null;
  let customPopover: HTMLElement | null = null;

  // Función para limpiar elementos custom del paso 4
  const cleanupStep4 = () => {
    if (customOverlay) {
      customOverlay.remove();
      customOverlay = null;
    }
    if (customPopover) {
      customPopover.remove();
      customPopover = null;
    }
    const btn = document.querySelector("#add-property-button");
    if (btn) {
      (btn as HTMLElement).style.zIndex = "";
      (btn as HTMLElement).style.backgroundColor = "";
      (btn as HTMLElement).style.color = "";
      (btn as HTMLElement).style.boxShadow = "";
      (btn as HTMLElement).style.transform = "";
    }
  };

  // Función para mostrar el popover custom del paso 4
  const showStep4Popover = () => {
    const btn = document.querySelector("#add-property-button") as HTMLElement;
    if (!btn) return;

    // Resaltar el botón
    btn.style.zIndex = "99999";
    btn.style.backgroundColor = "hsl(var(--primary))";
    btn.style.color = "hsl(var(--primary-foreground))";
    btn.style.boxShadow = "0 0 20px hsla(var(--primary), 0.6), 0 0 40px hsla(var(--primary), 0.3)";
    btn.style.transform = "scale(1.15)";
    btn.style.transition = "all 0.3s ease";

    // Crear overlay semitransparente
    customOverlay = document.createElement("div");
    customOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99998;
      pointer-events: auto;
    `;
    document.body.appendChild(customOverlay);

    // Crear popover custom al lado del botón
    const btnRect = btn.getBoundingClientRect();
    customPopover = document.createElement("div");
    customPopover.className = "driver-popover driver-popover-custom";
    customPopover.style.cssText = `
      position: fixed;
      top: ${btnRect.top + btnRect.height / 2 - 60}px;
      left: ${btnRect.left - 320}px;
      width: 300px;
      background: white;
      border-radius: 12px;
      padding: 20px;
      z-index: 99999;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      color: #1a1a1a;
    `;

    customPopover.innerHTML = `
      <div style="margin-bottom: 8px; font-size: 12px; color: #6b7280;">
        Paso 4 de 6
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        Agregá Propiedades
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
        Importá propiedades desde la web que no sean de agencias asociadas y sumá propiedades a tu listado para hacer seguimiento centralizado y compartir en familia.
      </p>
      <div class="driver-popover-footer" style="display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <button id="tour-skip-btn" style="
          margin-right: auto;
          color: #6b7280;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
        ">Saltar</button>
        <button class="driver-popover-footer-btn driver-popover-footer-btn--secondary" style="
          color: #6b7280;
          background: transparent;
          border: 1px solid #d1d5db;
          cursor: pointer;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
        ">Anterior</button>
        <button class="driver-popover-footer-btn driver-popover-footer-btn--primary" style="
          color: white;
          background: hsl(var(--primary));
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 500;
        ">Siguiente</button>
      </div>
    `;

    document.body.appendChild(customPopover);

    // Bind event listeners
    const skipBtn = customPopover.querySelector("#tour-skip-btn");
    const prevBtn = customPopover.querySelector(".driver-popover-footer-btn--secondary");
    const nextBtn = customPopover.querySelector(".driver-popover-footer-btn--primary");

    skipBtn?.addEventListener("click", () => {
      cleanupStep4();
      tourInstance?.destroy();
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    });

    prevBtn?.addEventListener("click", () => {
      cleanupStep4();
      tourInstance?.setActiveStep(2); // Ir al paso 3
    });

    nextBtn?.addEventListener("click", () => {
      cleanupStep4();
      tourInstance?.moveNext();
    });
  };

  // Definimos los pasos del tour con funciones onStart para asegurar visibilidad
  const steps: Step[] = [
    // Paso 1: Tu Perfil (avatar en header)
    {
      element: "#user-header-avatar",
      popover: {
        title: "Tu Perfil",
        description: "Accedé a tu perfil y Perfil IA para hacer Match con las publicaciones.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 2: Explorá Propiedades (tabs)
    {
      element: "#dashboard-tabs",
      popover: {
        title: "Explorá Propiedades",
        description:
          "Navegá entre tu listado personal (donde guardás, ves y hacés seguimiento a avisos para poder organizarte) y el HFMarket para navegar entre propiedades publicadas por las Agencias.",
        side: "bottom",
        align: "center",
      },
      onStart: () => {
        // Hacer scroll al inicio y esperar a que termine antes de que driver.js resalte
        scrollToTop();
        // Esperar 600ms para que el scroll termine antes del highlight
        waitAndExecute(600, () => {
          // Forzar re-highlight del elemento
          const tabs = document.querySelector("#dashboard-tabs");
          if (tabs) {
            tabs.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      },
    },
    // Paso 3: Tus Propiedades (primera tarjeta)
    {
      element: "#property-card-first",
      popover: {
        title: "Tus Propiedades",
        description: "Cada tarjeta muestra info clave. Hacé clic para ver más detalles.",
        side: "top",
        align: "center",
      },
    },
    // Paso 4: Agregá Propiedades (botón +)
    // Sin element para evitar que driver.js lo mueva - usamos popover custom
    {
      element: document.body,
      popover: {
        title: "Agregá Propiedades",
        description:
          "Importá propiedades desde la web que no sean de agencias asociadas y sumá propiedades a tu listado para hacer seguimiento centralizado y compartir en familia.",
      },
      onStart: () => {
        // Hacer scroll al top
        scrollToTop();
        waitAndExecute(400, () => {
          showStep4Popover();
        });
      },
      onDeselect: () => {
        cleanupStep4();
      },
    },
    // Paso 5: Trabajá en Equipo (compartir en familia)
    {
      element: "#share-family-button",
      popover: {
        title: "Trabajá en Equipo",
        description:
          "Compartí propiedades con tu familia. Botón crear para generar código de invitación, enviar y pegar en unirme para formar parte.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 6: Asistente IA (en el dropdown del avatar)
    {
      element: "#user-header-avatar",
      popover: {
        title: "Asistente IA",
        description: "Configurá tu perfil IA para recibir recomendaciones personalizadas. Hacé clic en tu avatar y seleccioná 'Perfil IA'.",
        side: "bottom",
        align: "center",
      },
      onStart: () => {
        scrollToTop();
      },
    },
  ];

  tourInstance = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.7,
    smoothScroll: false,
    showButtons: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    popoverClass: "driver-popover-custom",
    popoverOffset: 10,
    // Botón de Skip personalizado
    onHighlightStarted: (_element, step) => {
      // Ejecutar onStart del paso si existe
      if (step.onStart) {
        step.onStart();
      }

      // Agregar botón de skip si no existe
      waitAndExecute(200, () => {
        const existingSkipBtn = document.querySelector("#tour-skip-btn");
        if (!existingSkipBtn) {
          const skipBtn = document.createElement("button");
          skipBtn.id = "tour-skip-btn";
          skipBtn.textContent = "Saltar";
          skipBtn.className = "driver-popover-footer-btn";
          skipBtn.style.cssText = `
            margin-right: auto;
            color: #6b7280;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 6px 12px;
            border-radius: 6px;
            transition: background 0.2s;
          `;
          skipBtn.onmouseover = () => {
            skipBtn.style.background = "rgba(0,0,0,0.05)";
          };
          skipBtn.onmouseout = () => {
            skipBtn.style.background = "transparent";
          };
          skipBtn.onclick = () => {
            tourInstance?.destroy();
            localStorage.setItem(TOUR_SEEN_KEY, "true");
          };
          // Insertar antes de los otros botones
          const popoverFooter = document.querySelector(".driver-popover-footer");
          if (popoverFooter) {
            const firstBtn = popoverFooter.querySelector("button");
            if (firstBtn) {
              popoverFooter.insertBefore(skipBtn, firstBtn);
            } else {
              popoverFooter.appendChild(skipBtn);
            }
          }
        }
      });
    },
    steps: steps,
    onDestroyed: () => {
      // Marcar como visto cuando se cierra
      localStorage.setItem(TOUR_SEEN_KEY, "true");
      tourInstance = null;
      // Limpiar elementos custom del paso 4
      cleanupStep4();
      // Limpiar botón de skip (de otros pasos)
      const skipBtn = document.querySelector("#tour-skip-btn");
      if (skipBtn) skipBtn.remove();
    },
  });

  return tourInstance;
}

/**
 * Ejecuta el tour guiado.
 * Si no existe una instancia, la crea primero.
 *
 * @param force - Si es true, ejecuta el tour aunque ya se haya visto
 */
export function runDashboardTour(force = false): void {
  const hasSeenTour = localStorage.getItem(TOUR_SEEN_KEY) === "true";

  if (hasSeenTour && !force) {
    return;
  }

  // Destruir instancia previa si existe
  if (tourInstance) {
    tourInstance.destroy();
    tourInstance = null;
  }

  // Delay para asegurar que el DOM está listo
  setTimeout(() => {
    try {
      if (!tourInstance) {
        createDashboardTour();
      }
      // Esperar un poco más y hacer scroll al top antes de iniciar
      window.scrollTo({ top: 0, behavior: "instant" });
      setTimeout(() => {
        tourInstance?.drive();
      }, 300);
    } catch (error) {
      console.error("Error al ejecutar el tour:", error);
    }
  }, 800);
}

/**
 * Hook para verificar si el usuario ya vio el tour.
 *
 * @returns true si ya vio el tour, false si no
 */
export function hasUserSeenTour(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === "true";
}

/**
 * Resetea el estado del tour (para testing o para que lo vea de nuevo).
 */
export function resetTourState(): void {
  localStorage.removeItem(TOUR_SEEN_KEY);
}
