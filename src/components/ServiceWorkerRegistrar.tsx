"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ServiceWorkerRegistrar.module.css";

export default function ServiceWorkerRegistrar() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [showReload, setShowReload] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW registered:", registration.scope);

                    // If there's an waiting ServiceWorker right after registration
                    if (registration.waiting) {
                        setWaitingWorker(registration.waiting);
                        setShowReload(true);
                    }

                    // A new SW was found, wait for it to finish installing
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (!newWorker) return;

                        newWorker.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                // There's a new version available!
                                setWaitingWorker(newWorker);
                                setShowReload(true);
                            }
                        });
                    });
                })
                .catch((err) => {
                    console.error("SW registration failed:", err);
                });

            // Ensure reload happens only once when new SW takes over
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }
    }, []);

    const reloadPage = () => {
        if (waitingWorker) {
            // Tell the waiting SW to take control immediately
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
        } else {
            // Fallback hard reload
            window.location.reload();
        }
        setShowReload(false);
    };

    return (
        <AnimatePresence>
            {showReload && (
                <motion.div
                    className={styles.updateToast}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                >
                    <div className={styles.toastContent}>
                        <div className={styles.iconBox}>✨</div>
                        <div className={styles.textContainer}>
                            <p className={styles.toastText}>새로운 업데이트가 있습니다</p>
                            <p className={styles.toastSubtext}>최신 버전을 적용하려면 클릭하세요</p>
                        </div>
                    </div>
                    <button className={styles.reloadBtn} onClick={reloadPage}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        적용하기
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
