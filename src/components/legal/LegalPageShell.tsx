import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

interface LegalPageShellProps {
  /** Título principal del documento (h1) */
  title: string;
  /** Fecha o versión mostrada debajo del título */
  updatedLabel?: string;
  children: ReactNode;
}

/**
 * Layout para páginas legales: solo permite volver al registro (/auth?register=1).
 * El contenido legal completo va en children.
 */
export function LegalPageShell({ title, updatedLabel, children }: LegalPageShellProps) {
  const navigate = useNavigate();

  const goBackToRegister = () => {
    navigate(ROUTES.AUTH_REGISTER);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-center sm:justify-start">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2 rounded-xl w-full sm:w-auto"
            onClick={goBackToRegister}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al registro
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-border pb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {updatedLabel && <p className="text-sm text-muted-foreground">{updatedLabel}</p>}
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4 [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
            {children}
          </div>

          <div className="pt-6 border-t border-border">
            <Button type="button" className="w-full rounded-xl gap-2" onClick={goBackToRegister}>
              <ArrowLeft className="w-4 h-4" />
              Volver al registro
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
