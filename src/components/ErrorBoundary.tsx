import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./ui/button";
import { APP_BRAND_NAME_DEFAULT } from "@/lib/config-keys";

interface Props {
    children: ReactNode;
    appBrandName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Componente ErrorBoundary genérico para capturar errores de renderizado
 * Pensado como un componente de infraestructura senior (REGLA 2)
 */
class ErrorBoundaryCore extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary atrapó un error fatal:", error, errorInfo);

        // Auto-recovery: si es el error de instancias duplicadas de React
        // (ocurre tras inactividad prolongada + recarga), recargamos una sola vez
        const msg = error?.message || "";
        const isReactDupeError =
            msg.includes("Cannot read properties of null") &&
            (msg.includes("useEffect") || msg.includes("useRef") || msg.includes("useState") || msg.includes("useContext"));

        const RELOAD_KEY = "hf_react_dupe_reload";
        if (isReactDupeError && !sessionStorage.getItem(RELOAD_KEY)) {
            sessionStorage.setItem(RELOAD_KEY, "1");
            window.location.reload();
            return;
        }
        // Limpiar flag si llegamos aquí sin ese error
        sessionStorage.removeItem(RELOAD_KEY);
    }

    private handleReset = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
                    <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                        {/* Efectos de fondo premium */}
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
                        </div>

                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
                            <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                <AlertTriangle className="w-10 h-10 text-destructive animate-bounce" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Algo no salió bien
                                </h1>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {this.props.appBrandName} encontró un error inesperado al renderizar esta página.
                                    No te preocupes, tus datos están seguros.
                                </p>
                            </div>

                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <div className="p-4 bg-muted/50 rounded-xl text-left overflow-auto max-h-40">
                                    <p className="text-[10px] font-mono text-destructive/80 leading-tight">
                                        {this.state.error.stack}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    onClick={this.handleReset}
                                    className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Reintentar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={this.handleGoHome}
                                    className="flex-1 h-12 rounded-xl font-bold gap-2 border-border/50 hover:bg-muted/50 transition-all active:scale-95"
                                >
                                    <Home className="w-4 h-4" />
                                    Ir al Inicio
                                </Button>
                            </div>
                        </div>

                        <p className="text-center text-[10px] text-muted-foreground/50 font-medium tracking-widest uppercase">
                            {this.props.appBrandName} Resilience System v1.0
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
    // ErrorBoundary puede montarse antes del QueryClientProvider (main.tsx),
    // por eso no debe depender de hooks que usen React Query.
    const appBrandName = APP_BRAND_NAME_DEFAULT;
    return <ErrorBoundaryCore appBrandName={appBrandName} children={children} />;
};
