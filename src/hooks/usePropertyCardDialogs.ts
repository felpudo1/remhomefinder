import { useState } from "react";
import { toDatetimeLocalString } from "@/lib/date-utils";
import { Property } from "@/types/property";

/**
 * Hook para centralizar todos los estados de los diálogos de confirmación
 * que se muestran en la PropertyCard.
 * 
 * Separa la lógica de orquestación de la UI para mantener el componente principal limpio.
 */
export const usePropertyCardDialogs = (property: Property) => {
    // Diálogo de eliminación
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");

    // Diálogos de estados de descarte y pros/contras
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [showProsConsConfirm, setShowProsConsConfirm] = useState(false);
    const [pendingProsConsStatus, setPendingProsConsStatus] = useState<"firme_candidato" | "posible_interes" | null>(null);

    // Diálogo de visita coordinada
    const [showCoordinatedConfirm, setShowCoordinatedConfirm] = useState(false);
    const [coordinatedDateTime, setCoordinatedDateTime] = useState("");
    const [isEditingCoordinatedVisit, setIsEditingCoordinatedVisit] = useState(false);

    // Diálogo de oferta de calendario de Google
    const [showCalendarOfferConfirm, setShowCalendarOfferConfirm] = useState(false);
    const [calendarOfferDate, setCalendarOfferDate] = useState<Date | null>(null);

    // Otros diálogos (contactado, meta conseguida, encuesta)
    const [showContactedConfirm, setShowContactedConfirm] = useState(false);
    const [showMetaAchievedConfirm, setShowMetaAchievedConfirm] = useState(false);
    const [showMetaSurveyConfirm, setShowMetaSurveyConfirm] = useState(false);

    // Galería de imágenes
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryInitialImg, setGalleryInitialImg] = useState(0);

    /**
     * Prepara el diálogo de edición de visita coordinada
     */
    const handleEditCoordinatedVisit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingCoordinatedVisit(true);
        setCoordinatedDateTime(property.coordinatedDate ? toDatetimeLocalString(property.coordinatedDate) : "");
        setShowCoordinatedConfirm(true);
    };

    /** Abre el diálogo para ofrecer Google Calendar (el titular fijo va solo en StatusCalendarOfferDialog). */
    const handleCalendarOffer = (isoDate: string) => {
        setCalendarOfferDate(new Date(isoDate));
        setShowCalendarOfferConfirm(true);
    };

    return {
        // Estados
        showDeleteConfirm, setShowDeleteConfirm,
        deleteReason, setDeleteReason,
        showDiscardConfirm, setShowDiscardConfirm,
        showProsConsConfirm, setShowProsConsConfirm,
        pendingProsConsStatus, setPendingProsConsStatus,
        showCoordinatedConfirm, setShowCoordinatedConfirm,
        coordinatedDateTime, setCoordinatedDateTime,
        isEditingCoordinatedVisit, setIsEditingCoordinatedVisit,
        showCalendarOfferConfirm, setShowCalendarOfferConfirm,
        calendarOfferDate, setCalendarOfferDate,
        showContactedConfirm, setShowContactedConfirm,
        showMetaAchievedConfirm, setShowMetaAchievedConfirm,
        showMetaSurveyConfirm, setShowMetaSurveyConfirm,
        isGalleryOpen, setIsGalleryOpen,
        galleryInitialImg, setGalleryInitialImg,

        // Handlers
        handleEditCoordinatedVisit,
        handleCalendarOffer
    };
};
