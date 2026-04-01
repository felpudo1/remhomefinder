import React from "react";
import { PropertyDetailModal } from "./PropertyDetailModal";
import { AddPropertyModal } from "./AddPropertyModal";
import { GroupsModal } from "./GroupsModal";
import { UpgradePlanModal } from "./UpgradePlanModal";
import { PremiumWelcomeModal } from "./PremiumWelcomeModal";
import type {
    IndexAddCommentHandler,
    IndexDetailModalState,
    IndexGroupContext,
    IndexModalVisibilityState,
    IndexStatusChangeHandler,
} from "@/types/index-page";

interface IndexModalsProps {
    detailModal: IndexDetailModalState;
    propertyActions: {
        onStatusChange: IndexStatusChangeHandler;
        onAddComment: IndexAddCommentHandler;
        onAddProperty: (form: any) => Promise<void>;
        onOpenExistingListing?: (userListingId: string) => void;
    };
    visibility: IndexModalVisibilityState;
    groupContext: IndexGroupContext;
    maxSaves: number;
    welcomeType?: "user" | "agent";
}

/**
 * Orquestador de modales para la página de Index.
 * Extraído para reducir la complejidad visual del componente principal (REGLA 2).
 */
export const IndexModals: React.FC<IndexModalsProps> = ({
    detailModal,
    propertyActions,
    visibility,
    groupContext,
    maxSaves,
    welcomeType = "user",
}) => {
    return (
        <>
            <PropertyDetailModal
                property={detailModal.selectedProperty}
                open={detailModal.isOpen}
                onClose={() => detailModal.setIsOpen(false)}
                onStatusChange={propertyActions.onStatusChange}
                onAddComment={propertyActions.onAddComment}
                currentUserEmail={detailModal.currentUserEmail}
                currentUserDisplayName={detailModal.currentUserDisplayName}
            />

            <AddPropertyModal
                open={visibility.isAddZenRowsOpen}
                onClose={() => visibility.setIsAddZenRowsOpen(false)}
                onAdd={propertyActions.onAddProperty}
                activeGroupId={groupContext.activeGroupId}
                scraper="zenrows"
                onOpenExisting={propertyActions.onOpenExistingListing}
            />

            <AddPropertyModal
                open={visibility.isAddOpen}
                onClose={() => visibility.setIsAddOpen(false)}
                onAdd={propertyActions.onAddProperty}
                activeGroupId={groupContext.activeGroupId}
                onOpenExisting={propertyActions.onOpenExistingListing}
            />

            <GroupsModal
                open={visibility.isGroupsOpen}
                onClose={() => visibility.setIsGroupsOpen(false)}
                activeGroupId={groupContext.activeGroupId}
                onSelectGroup={groupContext.setActiveGroupId}
            />

            <UpgradePlanModal
                open={visibility.isUpgradeOpen}
                onClose={() => visibility.setIsUpgradeOpen(false)}
                limit={maxSaves}
            />

            <PremiumWelcomeModal
                open={visibility.isPremiumWelcomeOpen}
                onClose={() => visibility.setIsPremiumWelcomeOpen(false)}
                type={welcomeType}
            />
        </>
    );
};
