import { useEffect } from "react";
import { useBodyScrollLock } from "./useBodyScrollLock";

/**
 * Shared modal/overlay behaviour:
 *  - locks background scroll while open
 *  - closes on Escape key
 *
 * Outside-click is handled per-component via the backdrop element so that
 * clicks on the dialog itself (stopPropagation) don't dismiss it.
 */
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);
}
