/**
 * Tour guiado para el Dashboard de Agente.
 * Usa driver.js para mostrar un recorrido interactivo por las secciones principales.
 *
 * Se ejecuta automáticamente la primera vez que el agente entra al dashboard.
 * El usuario puede repetirlo desde el botón de ayuda (?) en el header.
 */

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/** Clave para guardar en localStorage si el usuario ya vio el tour */
const TOUR_SEEN_KEY = "agent-dashboard-tour-seen";

/**
 * Instancia del driver de tour.
 */
let tourInstance: ReturnType<typeof driver> | null = null;

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
 * Crea y configura la instancia del tour guiado para agente.
 */
export function createAgentDashboardTour(): ReturnType<typeof driver> {
  // Overlay y popover custom para el paso 4 (Importar desde web - botón fixed flotante)
  let customOverlay: HTMLElement | null = null;
  let customPopover: HTMLElement | null = null;

  // Función para limpiar elementos custom
  const cleanupCustomPopover = () => {
    if (customOverlay) {
      customOverlay.remove();
      customOverlay = null;
    }
    if (customPopover) {
      customPopover.remove();
      customPopover = null;
    }
    // Restaurar estilos del botón de importar
    const btn = document.querySelector("#agent-import-web-btn");
    if (btn) {
      (btn as HTMLElement).style.zIndex = "";
      (btn as HTMLElement).style.backgroundColor = "";
      (btn as HTMLElement).style.color = "";
      (btn as HTMLElement).style.boxShadow = "";
      (btn as HTMLElement).style.transform = "";
    }
  };

  // Función para mostrar popover custom al lado de un botón
  const showCustomPopoverForButton = (
    btnSelector: string,
    stepNumber: number,
    totalSteps: number,
    title: string,
    description: string
  ) => {
    const btn = document.querySelector(btnSelector) as HTMLElement;
    if (!btn) return;

    // Resaltar el botón
    btn.style.zIndex = "99999";
    btn.style.backgroundColor = "hsl(var(--primary))";
    btn.style.color = "hsl(var(--primary-foreground))";
    btn.style.boxShadow = "0 0 20px hsla(var(--primary), 0.6), 0 0 40px hsla(var(--primary), 0.3)";
    btn.style.transform = "scale(1.1)";
    btn.style.transition = "all 0.3s ease";

    // Crear overlay
    customOverlay = document.createElement("div");
    customOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99998;
      pointer-events: auto;
    `;
    document.body.appendChild(customOverlay);

    // Crear popover
    const btnRect = btn.getBoundingClientRect();
    customPopover = document.createElement("div");
    customPopover.className = "driver-popover driver-popover-custom";
    customPopover.style.cssText = `
      position: fixed;
      top: ${btnRect.top + btnRect.height / 2 - 50}px;
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
        Paso ${stepNumber} de ${totalSteps}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        ${title}
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
        ${description}
      </p>
      <div class="driver-popover-footer" style="display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <button id="tour-skip-btn" style="margin-right: auto; color: #6b7280; background: transparent; border: none; cursor: pointer; font-size: 14px; padding: 6px 12px; border-radius: 6px;">Saltar</button>
        <button class="driver-popover-footer-btn driver-popover-footer-btn--secondary" style="color: #6b7280; background: transparent; border: 1px solid #d1d5db; cursor: pointer; font-size: 14px; padding: 6px 12px; border-radius: 6px;">Anterior</button>
        <button class="driver-popover-footer-btn driver-popover-footer-btn--primary" style="color: white; background: hsl(var(--primary)); border: none; cursor: pointer; font-size: 14px; padding: 6px 16px; border-radius: 6px; font-weight: 500;">Siguiente</button>
      </div>
    `;

    document.body.appendChild(customPopover);

    // Bind events
    const skipBtn = customPopover.querySelector("#tour-skip-btn");
    const prevBtn = customPopover.querySelector(".driver-popover-footer-btn--secondary");
    const nextBtn = customPopover.querySelector(".driver-popover-footer-btn--primary");

    skipBtn?.addEventListener("click", () => {
      cleanupCustomPopover();
      tourInstance?.destroy();
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    });

    prevBtn?.addEventListener("click", () => {
      cleanupCustomPopover();
      tourInstance?.movePrevious();
    });

    nextBtn?.addEventListener("click", () => {
      cleanupCustomPopover();
      tourInstance?.moveNext();
    });
  };

  // Definimos los 10 pasos del tour
  const steps: any[] = [
    // Paso 1: Tu Agencia (logo de agencia)
    {
      element: "#agent-agency-logo",
      popover: {
        title: "Tu Agencia",
        description: "Subí el logo de tu agencia y accedé a la configuración desde aquí.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 2: Panel Completo (tabs)
    {
      element: "#agent-tabs",
      popover: {
        title: "Panel Completo",
        description: "Accedé a todas las herramientas: propiedades, estadísticas, indicadores, QR leads y más.",
        side: "bottom",
        align: "center",
      },
      onStart: () => {
        scrollToTop();
        waitAndExecute(400, () => {
          const tabs = document.querySelector("#agent-tabs");
          if (tabs) {
            tabs.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      },
    },
    // Paso 3: Gestioná tus Propiedades (primera tarjeta o sección)
    {
      element: "#agent-properties-section",
      popover: {
        title: "Gestioná tus Propiedades",
        description: "Editá, cambiá el estado, generá QR y revisá los AI Matches de cada propiedad.",
        side: "top",
        align: "center",
      },
    },
    // Paso 4: Importar desde web (popover custom para botón en la sección)
    {
      element: document.body,
      popover: undefined,
      onStart: () => {
        scrollToTop();
        waitAndExecute(400, () => {
          showCustomPopoverForButton(
            "#agent-import-web-btn",
            4,
            10,
            "Importación Masiva",
            "Importá propiedades desde portales web o archivos Excel automáticamente."
          );
        });
      },
      onDeselect: () => {
        cleanupCustomPopover();
      },
    },
    // Paso 5: Publicar propiedad
    {
      element: "#agent-publish-property-btn",
      popover: {
        title: "Publicar Propiedad",
        description: "Creá nuevas propiedades para tu agencia con todos los detalles.",
        side: "left",
        align: "start",
      },
    },
    // Paso 6: Listado
    {
      element: "#agent-listado-tab",
      popover: {
        title: "Listado",
        description: "Tu nueva oficina, el sensor de datos de cercanía. Muestra los cambios de estado, MatchAI, entre muchos otros indicadores de CTA, AQUÍ es donde sucede la magia.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 7: Estadísticas
    {
      element: "#agent-estadisticas-tab",
      popover: {
        title: "Auditoría y Métricas",
        description: "Analizá el rendimiento de tus propiedades con tablas, gráficos y resúmenes.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 8: Indicadores
    {
      element: "#agent-indicadores-tab",
      popover: {
        title: "Indicadores",
        description: "Muestrá datos generales del mercado.",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 9: QR Leads
    {
      element: "#agent-qr-leads-tab",
      popover: {
        title: "Analytics de QR",
        description: "Seguí cuántas personas escanean tus QRs y cómo convierten en leads (en desarrollo v1.0).",
        side: "bottom",
        align: "center",
      },
    },
    // Paso 10: Referencias
    {
      element: "#agent-referencias-tab",
      popover: {
        title: "Programa de Referidos",
        description: "Invitá clientes y ganá beneficios por cada referido exitoso.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  tourInstance = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.7,
    smoothScroll: false,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    popoverClass: "driver-popover-custom",
    popoverOffset: 10,
    // Botón de Skip personalizado
    onHighlightStarted: (_element: any, step: any) => {
      // Ejecutar onStart del paso si existe
      if (step.onStart) {
        step.onStart();
      }

      // Si el paso no tiene popover definido (como el paso 4 con popover custom), no agregar skip button
      if (!step.popover) return;

      // Agregar botón de skip si no existe (para pasos normales)
      waitAndExecute(200, () => {
        const existingSkipBtn = document.querySelector("#tour-skip-btn");
        if (!existingSkipBtn && !customPopover) {
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
          `;
          skipBtn.onclick = () => {
            cleanupCustomPopover();
            tourInstance?.destroy();
            localStorage.setItem(TOUR_SEEN_KEY, "true");
          };
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
      localStorage.setItem(TOUR_SEEN_KEY, "true");
      tourInstance = null;
      cleanupCustomPopover();
      const skipBtn = document.querySelector("#tour-skip-btn");
      if (skipBtn) skipBtn.remove();
    },
  });

  return tourInstance;
}

/**
 * Ejecuta el tour guiado del dashboard de agente.
 *
 * @param force - Si es true, ejecuta el tour aunque ya se haya visto
 */
export function runAgentDashboardTour(force = false): void {
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
        createAgentDashboardTour();
      }
      // Hacer scroll al top antes de iniciar
      window.scrollTo({ top: 0, behavior: "instant" });
      setTimeout(() => {
        tourInstance?.drive();
      }, 300);
    } catch (error) {
      console.error("Error al ejecutar el tour de agente:", error);
    }
  }, 800);
}

/**
 * Hook para verificar si el usuario ya vio el tour de agente.
 */
export function hasAgentUserSeenTour(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === "true";
}

/**
 * Resetea el estado del tour de agente.
 */
export function resetAgentTourState(): void {
  localStorage.removeItem(TOUR_SEEN_KEY);
}
