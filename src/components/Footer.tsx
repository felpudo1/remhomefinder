import { Heart, Mail, Phone, GitBranch, Clock, Info } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useAppVersion } from "@/hooks/useAppVersion";

import { Link } from "react-router-dom";
import {
  SUPPORT_EMAIL_CONFIG_KEY,
  SUPPORT_EMAIL_DEFAULT,
  SUPPORT_PHONE_CONFIG_KEY,
  SUPPORT_PHONE_DEFAULT,
  APP_BRAND_NAME_DEFAULT,
  APP_BRAND_NAME_KEY } from
"@/lib/config-keys";
import { ROUTES } from "@/lib/constants";
import { SupportWhatsAppLink } from "@/components/support/SupportWhatsAppLink";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DbStatusInline } from "@/components/ui/DbStatusBadge";

interface FooterProps {
  showDbStatus?: boolean;
}

export const Footer = ({ showDbStatus = false }: FooterProps) => {
  const { value: supportEmail } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);
  const { value: supportPhone } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const { version, commitHash, environment, environmentLabel, buildTimestamp, fullInfo, isLoading } = useAppVersion();
  const [showVersionDetails, setShowVersionDetails] = useState(false);

  // Formatear fecha de build
  const buildDate = new Date(buildTimestamp);
  const formattedDate = buildDate.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
  const formattedTime = buildDate.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <footer className="w-full py-8 border-t border-border mt-auto bg-card/30">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-3">
                {/* Línea 1: Copyright y branding */}
                <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <span>Hecho con</span>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                        <span>por</span>
                        <span className="font-bold text-foreground">{appBrandName}</span>
                    </div>
                     <p className="text-[11px] text-muted-foreground/60">© 2026 — Todos los derechos reservados. (V.1.2)</p>
                </div>

                {/* Línea 2: Términos y Privacidad */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <Link
            to={ROUTES.TERMS}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
            
                        Términos y condiciones
                    </Link>
                    <span className="text-muted-foreground/40 text-xs" aria-hidden>
                        ·
                    </span>
                    <Link
            to={ROUTES.PRIVACY}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
            
                        Política de privacidad
                    </Link>
                </div>

                {/* Línea 3: Contacto y Versión */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {supportEmail &&
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
            
                            <Mail className="w-3.5 h-3.5" />
                            Email Soporte
                        </a>
          }
                    {supportPhone &&
          <SupportWhatsAppLink
            supportPhone={supportPhone}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
            
                            <Phone className="w-3.5 h-3.5" />
                            WhatsApp Soporte
                        </SupportWhatsAppLink>
          }
                    
                    {/* Separador si hay versión */}
                    {(supportEmail || supportPhone) &&
          <span className="text-muted-foreground/40 text-xs hidden sm:inline" aria-hidden>
                            ·
                        </span>
          }

                    {/* Estado BD — solo si se pasa showDbStatus */}
                    {showDbStatus && (
                        <>
                            <DbStatusInline />
                            <span className="text-muted-foreground/40 text-xs hidden sm:inline" aria-hidden>·</span>
                        </>
                    )}
                    
                    {/* Versión de la aplicación — solo visible en desarrollo/preview */}
                    {!import.meta.env.PROD && environment !== 'production' && (
                    <button
            type="button"
            onClick={() => setShowVersionDetails(true)}
            className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors font-medium cursor-pointer px-2 py-1 rounded-md hover:bg-muted/50"
            title="Click para ver detalles de la versión">
            
                        {isLoading ?
            <Clock className="w-3 h-3 animate-spin" /> :

            <>
                                <GitBranch className="w-3 h-3" />
                                <span>v{version}</span>
                                {environment === 'preview' &&
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-yellow-500/20 text-yellow-600">
                                        PREV
                                    </span>
              }
                            </>
            }
                    </button>
                    )}
                </div>
            </div>

            {/* Modal con detalles de versión */}
            <Dialog open={showVersionDetails} onOpenChange={setShowVersionDetails}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-5 h-5 text-primary" />
                            <DialogTitle>Información de Versión</DialogTitle>
                        </div>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {/* Versión principal */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="text-sm font-medium text-muted-foreground">Versión</span>
                            <span className="text-lg font-bold text-primary">v{version}</span>
                        </div>

                        {/* Ambiente */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Ambiente</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                environment === 'production' ?
                'bg-green-500/20 text-green-600' :
                environment === 'preview' ?
                'bg-yellow-500/20 text-yellow-600' :
                'bg-blue-500/20 text-blue-600'}`
                }>
                                    {environmentLabel}
                                </span>
                            </div>
                        </div>

                        {/* Git info */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Commit</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {fullInfo?.git.commitHashFull || commitHash}
                                </code>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Branch</span>
                                <span className="text-xs font-medium">{fullInfo?.git.branch || 'unknown'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Fecha commit</span>
                                <span className="text-xs">{fullInfo?.git.commitDate || 'unknown'}</span>
                            </div>
                            {fullInfo?.git.isDirty &&
              <div className="text-xs text-orange-600 font-medium">
                                    ⚠️ Hay cambios sin commitear
                                </div>
              }
                        </div>

                        {/* Build info */}
                        <div className="space-y-2 text-sm border-t pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Build timestamp</span>
                                <span className="text-xs font-mono">{formattedDate} {formattedTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Node version</span>
                                <span className="text-xs font-mono">{fullInfo?.build.nodeVersion || 'unknown'}</span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                            <div className="flex items-center justify-between">
                                <span>App name</span>
                                <span className="font-medium">{fullInfo?.meta.name || 'homefinder'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Deployed at</span>
                                <span className="font-mono">{fullInfo?.meta.deployedAt || 'unknown'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `v${version} (${commitHash}) - ${environmentLabel}`
                );
              }}
              className="flex-1 text-xs">
              
                            Copiar info
                        </Button>
                        <Button
              variant="default"
              onClick={() => setShowVersionDetails(false)}
              className="flex-1 text-xs">
              
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </footer>);

};