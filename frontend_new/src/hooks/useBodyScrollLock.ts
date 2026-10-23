import { useEffect } from "react";

/**
 * Locks background <body> scroll while `active` is true (e.g. a modal/drawer is open).
 * Uses a simple overflow:hidden toggle and restores the previous value on close.
 * Reference-counted so multiple simultaneous overlays don't unlock each other early.
 */
let lockCount = 0;
let previousOverflow = "";

export function useBodyScrollLock(active: boolean) {
    useEffect(() => {
        if (!active || typeof document === "undefined") return;

        if (lockCount === 0) {
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }
        lockCount += 1;

        return () => {
            lockCount = Math.max(0, lockCount - 1);
            if (lockCount === 0) {
                document.body.style.overflow = previousOverflow;
            }
        };
    }, [active]);
}
