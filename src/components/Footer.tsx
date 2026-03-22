import { Heart, Mail, Phone } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";

import { Link } from "react-router-dom";
import {
    SUPPORT_EMAIL_CONFIG_KEY,
    SUPPORT_EMAIL_DEFAULT,
    SUPPORT_PHONE_CONFIG_KEY,
    SUPPORT_PHONE_DEFAULT,
    APP_BRAND_NAME_DEFAULT,
    APP_BRAND_NAME_KEY,
} from "@/lib/config-keys";
import { ROUTES } from "@/lib/constants";
import { SupportWhatsAppLink } from "@/components/support/SupportWhatsAppLink";

export const Footer = () => {
    const { value: supportEmail } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);
    const { value: supportPhone } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

    return (
        <footer className="w-full py-8 border-t border-border mt-auto bg-card/30">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span>Hecho con</span>
                    <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                    <span>por</span>
                    <span className="font-bold text-foreground">{appBrandName}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                    © {new Date().getFullYear()} — Todos los derechos reservados.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
                    <Link
                        to={ROUTES.TERMS}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        Términos
                    </Link>
                    <span className="text-muted-foreground/40 text-xs" aria-hidden>
                        ·
                    </span>
                    <Link
                        to={ROUTES.PRIVACY}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        Privacidad
                    </Link>
                    {(supportEmail || supportPhone) && (
                        <span className="text-muted-foreground/40 text-xs hidden sm:inline" aria-hidden>
                            ·
                        </span>
                    )}
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
                        <SupportWhatsAppLink
                            supportPhone={supportPhone}
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium border-b border-transparent hover:border-primary/30 py-0.5"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            WhatsApp Soporte
                        </SupportWhatsAppLink>
                    )}
                </div>
            </div>
        </footer>
    );
};
