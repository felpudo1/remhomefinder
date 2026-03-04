import { Clock, Ban, Trash2 } from "lucide-react";
import { UserStatus } from "@/types/property";

const STATUS_BANNERS: Record<Exclude<UserStatus, "active">, {
  icon: React.ElementType;
  title: string;
  message: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconClass: string;
}> = {
  pending: {
    icon: Clock,
    title: "Cuenta pendiente de activación",
    message: "Tu cuenta está pendiente de aprobación por un administrador. Mientras tanto, podés explorar la plataforma pero algunas funcionalidades estarán limitadas.",
    bgClass: "bg-yellow-500/5",
    borderClass: "border-yellow-500/20",
    textClass: "text-yellow-800",
    iconClass: "text-yellow-600",
  },
  suspended: {
    icon: Ban,
    title: "Cuenta suspendida",
    message: "Tu cuenta ha sido suspendida temporalmente por un administrador. No podrás realizar cambios hasta que se restablezca tu acceso. Si creés que es un error, contactá al soporte.",
    bgClass: "bg-orange-500/5",
    borderClass: "border-orange-500/20",
    textClass: "text-orange-800",
    iconClass: "text-orange-600",
  },
  rejected: {
    icon: Trash2,
    title: "Cuenta eliminada",
    message: "Tu cuenta ha sido desactivada por un administrador. No podés realizar operaciones. Contactá al soporte si necesitás más información.",
    bgClass: "bg-destructive/5",
    borderClass: "border-destructive/20",
    textClass: "text-destructive",
    iconClass: "text-destructive",
  },
};

interface UserStatusBannerProps {
  status: UserStatus;
}

export const UserStatusBanner = ({ status }: UserStatusBannerProps) => {
  if (status === "active") return null;

  const config = STATUS_BANNERS[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl ${config.bgClass} border ${config.borderClass} p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconClass}`} />
        </div>
        <div className="space-y-1">
          <h3 className={`font-semibold ${config.textClass}`}>{config.title}</h3>
          <p className={`text-sm ${config.textClass} opacity-80 leading-relaxed`}>{config.message}</p>
        </div>
      </div>
    </div>
  );
};
