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
    const [calendarMotivationText, setCalendarMotivationText] = useState(
        "🏡✨ Falta menos para ver tu próximo hogar. ¡No te olvides de agendar la cita!"
    );

    // Otros diálogos (contactado, meta conseguida, encuesta)
    const [showContactedConfirm, setShowContactedConfirm] = useState(false);
    const [showMetaAchievedConfirm, setShowMetaAchievedConfirm] = useState(false);
    const [showMetaSurveyConfirm, setShowMetaSurveyConfirm] = useState(false);

    // Galería de imágenes
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryInitialImg, setGalleryInitialImg] = useState(0);

    const calendarMotivationOptions = [
        "🏡✨ Falta menos para ver tu próximo hogar. ¡No te olvides de agendar la cita!",
        "🧠💘 Modo cabecita de novio: que no se te escape la cita, agendala ahora.",
        "📅🔥 Pero que cabecita de novio/a, mira que no te olvidás de la cabeza porque la tenés pegada: ¡ayudate a vos y agenda la visita en el calendario!",
        "🚀🏠 Un clic más y estás más cerca de comprar. Sumala al calendario ahora.",
        "⏰💡 Tu yo del futuro te lo agradece: dejá la visita agendada y listo.",
    ];

    /**
     * Prepara el diálogo de edición de visita coordinada
     */
    const handleEditCoordinatedVisit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingCoordinatedVisit(true);
        setCoordinatedDateTime(property.coordinatedDate ? toDatetimeLocalString(property.coordinatedDate) : "");
        setShowCoordinatedConfirm(true);
    };

    /**
     * Prepara el diálogo de oferta de calendario con un texto motivacional aleatorio
     */
    const handleCalendarOffer = (isoDate: string) => {
        const randomIndex = Math.floor(Math.random() * calendarMotivationOptions.length);
        setCalendarMotivationText(calendarMotivationOptions[randomIndex]);
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
        calendarMotivationText,
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
