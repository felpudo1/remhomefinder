import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Copy, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 font-bold">¡Ya está en tu familia!</AlertTitle>
        <AlertDescription className="text-red-700">
          <p className="mb-2">
            Este aviso fue ingresado por <strong>{urlInFamily.addedByName}</strong> {formatDaysAgo(urlInFamily.addedAt)}.
            Su estado actual es <strong>{urlInFamily.status}</strong>.
          </p>
          {onOpenExisting && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-1 bg-white hover:bg-red-100 border-red-300 text-red-700"
              onClick={() => onOpenExisting(urlInFamily.userListingId)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver publicación existente
            </Button>
          )}
        </AlertDescription>
      </Alert>
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
