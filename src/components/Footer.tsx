import { Heart } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="w-full py-8 border-t border-border mt-auto bg-card/30">
            <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span>Hecho con</span>
                    <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                    <span>por</span>
                    <span className="font-bold text-foreground">HomeFinder</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                    © {new Date().getFullYear()} — Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};
