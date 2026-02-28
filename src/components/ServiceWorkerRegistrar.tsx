"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistrar: Silent version.
 * Handles background registration and update checks without disturbing the user.
 * Updates will be applied on the next manual reload (e.g., pull-to-refresh).
 */
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW registered:", registration.scope);

                    // Check for updates every time the window is focused
                    const handleFocus = () => {
                        registration.update().catch(err => console.error("SW update check failed:", err));
                    };
                    window.addEventListener("focus", handleFocus);

                    // Also check every hour
                    const interval = setInterval(() => {
                        registration.update().catch(err => console.error("SW periodic update failed:", err));
                    }, 1000 * 60 * 60);

                    return () => {
                        window.removeEventListener("focus", handleFocus);
                        clearInterval(interval);
                    };
                })
                .catch((err) => {
                    console.error("SW registration failed:", err);
                });
        }
    }, []);

    return null; // Silent component
}
