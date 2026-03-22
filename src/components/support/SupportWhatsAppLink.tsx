import type { AnchorHTMLAttributes, ReactNode } from "react";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface SupportWhatsAppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  supportPhone: string;
  message?: string;
  children: ReactNode;
}

export function SupportWhatsAppLink({
  supportPhone,
  message,
  children,
  className,
  target = "_blank",
  rel,
  ...props
}: SupportWhatsAppLinkProps) {
  if (!supportPhone?.trim()) return null;

  const href = buildWhatsAppUrl(supportPhone, message);
  const safeRel = target === "_blank" ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ") : rel;

  return (
    <a href={href} target={target} rel={safeRel} className={cn(className)} {...props}>
      {children}
    </a>
  );
}
