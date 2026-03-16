import React from "react";
import { PropertyDetailModal } from "./PropertyDetailModal";
import { AddPropertyModal } from "./AddPropertyModal";
import { GroupsModal } from "./GroupsModal";
import { UpgradePlanModal } from "./UpgradePlanModal";
import { PremiumWelcomeModal } from "./PremiumWelcomeModal";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";

interface IndexModalsProps {
    // Estados de detalle
    selectedProperty: Property | null;
    isDetailOpen: boolean;
    setIsDetailOpen: (open: boolean) => void;
    currentUserEmail: string | null;
    currentUserDisplayName?: string | null;

    // Handlers de propiedad
    onStatusChange: (
        id: string,
        status: PropertyStatus,
        deletedReason?: string,
        coordinatedDate?: string | null,
        groupId?: string | null,
        contactedName?: string,
        discardedAttributeIds?: string[],
        prosAndCons?: { positiveIds: string[]; negativeIds: string[] }
    ) => Promise<void>;
    onAddComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => Promise<void>;
    onAddProperty: (form: any) => Promise<void>;

    // Estados de control de apertura
    isAddZenRowsOpen: boolean;
    setIsAddZenRowsOpen: (open: boolean) => void;
    isAddOpen: boolean;
    setIsAddOpen: (open: boolean) => void;
    isGroupsOpen: boolean;
    setIsGroupsOpen: (open: boolean) => void;
    isUpgradeOpen: boolean;
    setIsUpgradeOpen: (open: boolean) => void;
    isPremiumWelcomeOpen: boolean;
    setIsPremiumWelcomeOpen: (open: boolean) => void;

    // Datos de contexto
    activeGroupId: string | null;
    setActiveGroupId: (id: string | null) => void;
    maxSaves: number;
    propertiesCount: number;
    welcomeType?: "user" | "agent";
}

/**
 * Orquestador de modales para la página de Index.
 * Extraído para reducir la complejidad visual del componente principal (REGLA 2).
 */
export const IndexModals: React.FC<IndexModalsProps> = ({
    selectedProperty,
    isDetailOpen,
    setIsDetailOpen,
    currentUserEmail,
    currentUserDisplayName,
    onStatusChange,
    onAddComment,
    onAddProperty,
    isAddZenRowsOpen,
    setIsAddZenRowsOpen,
    isAddOpen,
    setIsAddOpen,
    isGroupsOpen,
    setIsGroupsOpen,
    isUpgradeOpen,
    setIsUpgradeOpen,
    isPremiumWelcomeOpen,
    setIsPremiumWelcomeOpen,
    activeGroupId,
    setActiveGroupId,
    maxSaves,
    welcomeType = "user",
}) => {
    return (
        <>
            <PropertyDetailModal
                property={selectedProperty}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onStatusChange={onStatusChange}
                onAddComment={onAddComment}
                currentUserEmail={currentUserEmail}
                currentUserDisplayName={currentUserDisplayName}
            />

            <AddPropertyModal
                open={isAddZenRowsOpen}
                onClose={() => setIsAddZenRowsOpen(false)}
                onAdd={onAddProperty}
                activeGroupId={activeGroupId}
                scraper="zenrows"
            />

            <AddPropertyModal
                open={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAdd={onAddProperty}
                activeGroupId={activeGroupId}
            />

            <GroupsModal
                open={isGroupsOpen}
                onClose={() => setIsGroupsOpen(false)}
                activeGroupId={activeGroupId}
                onSelectGroup={setActiveGroupId}
            />

            <UpgradePlanModal
                open={isUpgradeOpen}
                onClose={() => setIsUpgradeOpen(false)}
                limit={maxSaves}
            />

            <PremiumWelcomeModal
                open={isPremiumWelcomeOpen}
                onClose={() => setIsPremiumWelcomeOpen(false)}
                type={welcomeType}
            />
        </>
    );
};
