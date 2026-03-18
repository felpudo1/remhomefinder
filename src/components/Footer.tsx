import { Heart, Mail, Phone } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";

import {
    SUPPORT_EMAIL_CONFIG_KEY,
    SUPPORT_EMAIL_DEFAULT,
    SUPPORT_PHONE_CONFIG_KEY,
    SUPPORT_PHONE_DEFAULT
} from "@/lib/config-keys";

export const Footer = () => {
    const { value: supportEmail } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);
    const { value: supportPhone } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);

    return (
        <footer className="w-full py-8 border-t border-border mt-auto bg-card/30">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span>Hecho con</span>
                    <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                    <span>por</span>
                    <span className="font-bold text-foreground">HomeFinder</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                    © {new Date().getFullYear()} — Todos los derechos reservados.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
                    {supportEmail && (
                        <a
                            href={`mailto:${supportEmail}`}
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium border-b border-transparent hover:border-primary/30 py-0.5"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Email Soporte
                        </a>
                    )}
                    {supportPhone && (
                        <a
                            href={`https://wa.me/${supportPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium border-b border-transparent hover:border-primary/30 py-0.5"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            WhatsApp Soporte
                        </a>
                    )}
                </div>
            </div>
        </footer>
    );
};
