import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { AgentOwnPublicationNotice } from "./AgentOwnPublicationNotice";

interface DuplicateAlertProps {
  urlInFamily?: {
    addedByName: string;
    addedAt: string;
    status: string;
    userListingId: string;
  } | null;
  urlInApp?: {
    firstAddedAt: string;
    usersCount: number;
  } | null;
  onOpenExisting?: (userListingId: string) => void;
  formatDaysAgo: (date: string) => string;
}

export function DuplicateAlert({ urlInFamily, urlInApp, onOpenExisting, formatDaysAgo }: DuplicateAlertProps) {
  if (urlInFamily) {
    return (
      <AgentOwnPublicationNotice
        addedByName={urlInFamily.addedByName}
        addedAtIso={urlInFamily.addedAt}
        onViewClick={() => onOpenExisting?.(urlInFamily.userListingId)}
        actionLabel="Para verlo hacé click acá"
      />
    );
  }

  if (urlInApp) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">Publicación conocida</AlertTitle>
        <AlertDescription className="text-blue-700">
          Este aviso ya fue ingresado hace {formatDaysAgo(urlInApp.firstAddedAt)} por otros usuarios. 
          {urlInApp.usersCount > 0 && ` Actualmente lo tienen ${urlInApp.usersCount} usuario(s) como favorito.`}
          <br />
          <span className="text-xs font-semibold mt-1 block">Podés agregarlo a tu listado igualmente.</span>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
